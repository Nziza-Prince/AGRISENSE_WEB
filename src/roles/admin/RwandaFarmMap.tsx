import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, CornerLeftUp, Home, MapPin, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react";
import type { Farm } from "@/api";
import { DISTRICTS, MAP_BOUNDS, PROVINCE_OUTLINES, project } from "./rwandaMap";

/** One sector, cell or village. Sectors hold cells, cells hold villages (src/data/geo/<District>.json, built by scripts/build-rwanda-geo.py). */
interface GeoUnit {
  name: string;
  d: string;
  cx: number;
  cy: number;
  cells?: GeoUnit[];
  villages?: GeoUnit[];
}
const geoFiles = import.meta.glob<{ default: { sectors: GeoUnit[] } }>("../../data/geo/*.json");
const geoCache = new Map<string, GeoUnit[]>();
async function loadSectors(district: string): Promise<GeoUnit[]> {
  const hit = geoCache.get(district);
  if (hit) return hit;
  const load = geoFiles[`../../data/geo/${district}.json`];
  const sectors = load ? (await load()).default.sectors : [];
  geoCache.set(district, sectors);
  return sectors;
}

const LEVELS = ["District", "Sector", "Cell", "Village"] as const;

const SOIL_COLORS: Record<string, string> = {
  LOAMY: "#B45309",
  CLAYEY: "#BE123C",
  CLAY: "#BE123C",
  SANDY: "#CA8A04",
  ALLUVIAL: "#0F766E",
  SILTY: "#0F766E",
};
const soilColor = (soil?: string) => SOIL_COLORS[(soil || "").toUpperCase()] ?? "#64748B";

const HECTARE = 10000; // farm size is stored in m²
const norm = (v?: string) => (v || "").trim().toLowerCase();

const W = MAP_BOUNDS.width;
const H = MAP_BOUNDS.height;
type VB = { x: number; y: number; w: number; h: number };
const FULL: VB = { x: 0, y: 0, w: W, h: H };
const MAX_ZOOM = 200; // deep enough to fill the map with a single village
const MIN_W = W / MAX_ZOOM;
const RATIO = H / W;

/** The view that shows all of Rwanda inside a box of the given height/width ratio, centred. */
const fullView = (ratio: number): VB => {
  if (ratio >= RATIO) {
    const h = W * ratio;
    return { x: 0, y: (H - h) / 2, w: W, h };
  }
  const w = H / ratio;
  return { x: (W - w) / 2, y: 0, w, h: H };
};

/** Bounding box of a path, read from its data and remembered. */
const boxCache = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
function boxOf(d: string) {
  let box = boxCache.get(d);
  if (!box) {
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      minX = Math.min(minX, nums[i]); maxX = Math.max(maxX, nums[i]);
      minY = Math.min(minY, nums[i + 1]); maxY = Math.max(maxY, nums[i + 1]);
    }
    box = { minX, minY, maxX, maxY };
    boxCache.set(d, box);
  }
  return box;
}
const keyOf = (...names: string[]) => names.map((n) => n.replace(/[^a-z0-9]/gi, "").toLowerCase()).join("/");

interface DistrictStats {
  farms: Farm[];
  withGps: number;
  areaM2: number;
  farmers: number;
  soils: Record<string, number>;
}

function shade(count: number, max: number) {
  if (count === 0) return "#EEF0F4";
  const t = max <= 1 ? 1 : 0.25 + 0.75 * (count / max);
  return `rgba(67,56,202,${t.toFixed(2)})`;
}

/** Keeps the view inside the map (a little slack at the edges) and in the box's shape. */
const clampVB = (v: VB, ratio = RATIO): VB => {
  const w = Math.min(Math.max(v.w, MIN_W), fullView(ratio).w);
  const h = w * ratio;
  const range = (size: number, total: number, at: number) => Math.min(Math.max(at, Math.min(-total * 0.05, (total - size) / 2)), Math.max(total * 1.05 - size, (total - size) / 2));
  return { x: range(w, W, v.x), y: range(h, H, v.y), w, h };
};

interface Unit {
  level: 0 | 1 | 2 | 3;
  name: string;
  sub: string;
  key: string;
  d: string;
  cx: number;
  cy: number;
}

export default function RwandaFarmMap({ farms }: { farms: Farm[] }) {
  const [trail, setTrail] = useState<string[]>([]); // district, sector, cell, village names that are open
  const [farmId, setFarmId] = useState<string | null>(null);
  const [hover, setHover] = useState<Unit | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 }); // pointer position inside the map box, for the hover card
  const [sectors, setSectors] = useState<{ district: string; list: GeoUnit[] } | null>(null);
  const [vb, setVb] = useState<VB>(FULL);
  const vbRef = useRef<VB>(FULL);
  const raf = useRef<number | null>(null);
  const ratioRef = useRef(RATIO); // height / width of the map box, so the view always fills it
  const flyTarget = useRef<VB | null>(null); // where a running animation is heading, so repeated clicks add up
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; vb: VB } | null>(null);
  const [isFs, setIsFs] = useState(false); // real browser fullscreen
  const [pseudoFs, setPseudoFs] = useState(false); // page-filling fallback where the browser has no fullscreen
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 520, h: 460 });
  const drag = useRef<{ x: number; y: number; vb: VB; moved: boolean } | null>(null);

  const apply = useCallback((next: VB) => {
    vbRef.current = next;
    setVb(next);
  }, []);

  const clamp = useCallback((v: VB) => clampVB(v, ratioRef.current), []);

  const stopFly = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    flyTarget.current = null;
  }, []);

  const flyTo = useCallback(
    (target: VB, ms = 450) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      const from = vbRef.current;
      const to = clamp(target);
      flyTarget.current = to;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / ms, 1);
        const e = 1 - Math.pow(1 - t, 3);
        apply({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
        if (t < 1) raf.current = requestAnimationFrame(step);
        else flyTarget.current = null;
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, clamp],
  );

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
      const ratio = el.clientHeight / el.clientWidth;
      if (Math.abs(ratio - ratioRef.current) < 0.001) return;
      const was = ratioRef.current;
      ratioRef.current = ratio; // box changed shape (fullscreen, resize)
      const cur = vbRef.current;
      stopFly();
      if (cur.w >= fullView(was).w * 0.98) return apply(fullView(ratio)); // showing all of Rwanda: show all of it in the new shape
      const w = Math.min(cur.w, fullView(ratio).w); // zoomed in: keep the same centre
      apply(clampVB({ x: cur.x + cur.w / 2 - w / 2, y: cur.y + cur.h / 2 - (w * ratio) / 2, w, h: w * ratio }, ratio));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [apply, stopFly]);

  const openDistrict = trail[0];
  useEffect(() => {
    if (!openDistrict) return;
    let live = true;
    void loadSectors(openDistrict).then((list) => live && setSectors({ district: openDistrict, list }));
    return () => { live = false; };
  }, [openDistrict]);

  /** Zooms straight away around a point (map units; the centre by default). Used by the wheel and pinch. */
  const zoomBy = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      stopFly();
      const cur = vbRef.current;
      const ratio = ratioRef.current;
      const px = cx ?? cur.x + cur.w / 2;
      const py = cy ?? cur.y + cur.h / 2;
      const w = Math.min(Math.max(cur.w * factor, MIN_W), fullView(ratio).w);
      const h = w * ratio;
      apply(clamp({ x: px - ((px - cur.x) / cur.w) * w, y: py - ((py - cur.y) / cur.h) * h, w, h }));
    },
    [apply, clamp, stopFly],
  );

  /** Zooms about the centre with a short glide. Clicks made while it glides add up instead of restarting. */
  const zoomStep = useCallback(
    (factor: number) => {
      const base = flyTarget.current ?? vbRef.current;
      const ratio = ratioRef.current;
      const w = Math.min(Math.max(base.w * factor, MIN_W), fullView(ratio).w);
      const h = w * ratio;
      flyTo({ x: base.x + base.w / 2 - w / 2, y: base.y + base.h / 2 - h / 2, w, h }, 260);
    },
    [flyTo],
  );

  // Wheel zoom around the cursor. It has to be a non-passive listener so the page does not scroll as well.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cur = vbRef.current;
      const delta = Math.max(-120, Math.min(120, e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)) * (e.ctrlKey ? 2.5 : 1); // ctrl is a trackpad pinch
      zoomBy(Math.exp(delta * 0.0018), cur.x + ((e.clientX - rect.left) / rect.width) * cur.w, cur.y + ((e.clientY - rect.top) / rect.height) * cur.h);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Fullscreen: the browser's own where it exists, otherwise the map fills the page.
  useEffect(() => {
    const on = () => setIsFs(document.fullscreenElement === boxRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  useEffect(() => {
    if (!pseudoFs) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudoFs(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pseudoFs]);
  const fullscreen = isFs || pseudoFs;
  const toggleFullscreen = async () => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      setPseudoFs(false);
      return void (await document.exitFullscreen().catch(() => undefined));
    }
    if (pseudoFs) return setPseudoFs(false);
    if (el.requestFullscreen) {
      try {
        // some embedded browsers neither start nor refuse, so give it a moment before filling the page instead
        await Promise.race([el.requestFullscreen(), new Promise((_, no) => window.setTimeout(no, 700))]);
        if (document.fullscreenElement === el) return;
      } catch {
        /* blocked or unsupported */
      }
      if (document.fullscreenElement) return;
    }
    setPseudoFs(true);
  };

  // Farm totals for every place, keyed district, district/sector, district/sector/cell and so on.
  const stats = useMemo(() => {
    const map = new Map<string, DistrictStats>();
    const add = (key: string, farm: Farm) => {
      const s = map.get(key) ?? { farms: [], withGps: 0, areaM2: 0, farmers: 0, soils: {} };
      s.farms.push(farm);
      if (typeof farm.latitude === "number" && typeof farm.longitude === "number") s.withGps += 1;
      s.areaM2 += Number(farm.size) || 0;
      const soil = (farm.soilType || "Unknown").toString();
      s.soils[soil] = (s.soils[soil] || 0) + 1;
      map.set(key, s);
    };
    for (const farm of farms) {
      const names = [farm.district, farm.sector, farm.cell, farm.village];
      for (let i = 0; i < names.length && norm(names[i]); i++) add(keyOf(...names.slice(0, i + 1).map((n) => n || "")), farm);
    }
    for (const s of map.values()) {
      s.farmers = new Set(s.farms.map((f) => norm(f.ownerEmail) || norm(f.ownerName) || f.id)).size;
    }
    return map;
  }, [farms]);
  const byDistrict = useMemo(() => new Map([...stats].filter(([k]) => !k.includes("/"))), [stats]);

  const max = Math.max(0, ...[...byDistrict.values()].map((s) => s.farms.length));
  const unmatched = [...byDistrict.keys()].filter((k) => !DISTRICTS.some((d) => keyOf(d.name) === k));
  const gpsFarms = farms.filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number");
  const totalArea = farms.reduce((sum, f) => sum + (Number(f.size) || 0), 0);

  // What is open at each level. Sectors, cells and villages exist only once the district's file has loaded.
  const district = DISTRICTS.find((d) => d.name === trail[0]);
  const sectorList = district && sectors?.district === district.name ? sectors.list : null;
  const sector = sectorList?.find((s) => s.name === trail[1]);
  const cell = sector?.cells?.find((c) => c.name === trail[2]);
  const village = cell?.villages?.find((v) => v.name === trail[3]);
  const loadingSectors = !!district && !sectorList;

  const unitFor = (level: Unit["level"], name: string, u: { d: string; cx: number; cy: number }, parents: string[], sub: string): Unit => ({
    level, name, sub, d: u.d, cx: u.cx, cy: u.cy, key: keyOf(...parents, name),
  });
  const chain: Unit[] = [];
  if (district) chain.push(unitFor(0, district.name, district, [], district.province));
  if (sector && district) chain.push(unitFor(1, sector.name, sector, [district.name], `${district.name} District`));
  if (cell && sector && district) chain.push(unitFor(2, cell.name, cell, [district.name, sector.name], `${sector.name} Sector, ${district.name}`));
  if (village && cell && sector && district) chain.push(unitFor(3, village.name, village, [district.name, sector.name, cell.name], `${cell.name} Cell, ${sector.name}`));
  const selected = chain[chain.length - 1] as Unit | undefined;

  const selectedFarm = farmId ? farms.find((f) => f.id === farmId) : undefined;
  const panelUnit = selected ?? hover ?? undefined;
  const panelStats = panelUnit ? stats.get(panelUnit.key) : undefined;

  const fitBox = useCallback(
    (box: { minX: number; minY: number; maxX: number; maxY: number }, minPad = 1) => {
      const ratio = ratioRef.current;
      const pad = Math.max(Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.18 + 1, minPad);
      const bw = box.maxX - box.minX + pad * 2;
      const bh = box.maxY - box.minY + pad * 2;
      const w = Math.max(bw, bh / ratio);
      const h = w * ratio;
      flyTo({ x: (box.minX + box.maxX) / 2 - w / 2, y: (box.minY + box.maxY) / 2 - h / 2, w, h });
    },
    [flyTo],
  );
  const fit = useCallback((d: string | null) => (d ? fitBox(boxOf(d)) : flyTo(fullView(ratioRef.current))), [fitBox, flyTo]);

  /** Opens `name` at `level` (closing anything deeper), or steps back up when it is the one already open. */
  const toggle = (level: Unit["level"], name: string, d: string) => {
    const open = trail.length === level + 1 && trail[level] === name;
    const next = open ? trail.slice(0, level) : [...trail.slice(0, level), name];
    setTrail(next);
    setFarmId(null);
    fit(open ? [null, district?.d, sector?.d, cell?.d][level] ?? null : d);
  };
  const goTo = (depth: number) => {
    setTrail(trail.slice(0, depth));
    setFarmId(null);
    fit(depth ? chain[depth - 1]?.d ?? null : null);
  };
  const reset = () => goTo(0);
  const showFarms = () => {
    if (!gpsFarms.length) return;
    const pts = gpsFarms.map((f) => project(Number(f.longitude), Number(f.latitude)));
    setTrail([]);
    setFarmId(null);
    fitBox({ minX: Math.min(...pts.map((q) => q[0])), maxX: Math.max(...pts.map((q) => q[0])), minY: Math.min(...pts.map((q) => q[1])), maxY: Math.max(...pts.map((q) => q[1])) }, 10);
  };
  const close = () => (farmId ? setFarmId(null) : goTo(trail.length - 1));

  // Where a clicked farm's popup sits, in pixels inside the map box, so it follows pan and zoom.
  const anchor = useMemo(() => {
    let ax: number | null = null;
    let ay: number | null = null;
    if (selectedFarm && selectedFarm.longitude != null && selectedFarm.latitude != null) {
      [ax, ay] = project(Number(selectedFarm.longitude), Number(selectedFarm.latitude));
    }
    if (ax == null || ay == null) return null;
    const scale = Math.min(size.w / vb.w, size.h / vb.h);
    const offX = (size.w - vb.w * scale) / 2;
    const offY = (size.h - vb.h * scale) / 2;
    return { x: offX + (ax - vb.x) * scale, y: offY + (ay - vb.y) * scale };
  }, [selectedFarm, vb, size]);

  const k = vb.w / W; // keeps dots and labels the same size on screen while zooming
  const pxPerUnit = Math.min(size.w / vb.w, size.h / vb.h);
  const MIN_K = 1 / MAX_ZOOM;
  const canZoomIn = vb.w > MIN_W * 1.01;
  const canZoomOut = vb.w < fullView(ratioRef.current).w * 0.99;

  const moveCursor = (e: React.PointerEvent) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (r) setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // second finger: pinch to zoom, and the first finger's tap no longer counts as a click
      stopFly();
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, vb: vbRef.current };
      drag.current = { x: e.clientX, y: e.clientY, vb: vbRef.current, moved: true };
      for (const id of pointers.current.keys()) e.currentTarget.setPointerCapture(id);
      return;
    }
    drag.current = { x: e.clientX, y: e.clientY, vb: vbRef.current, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    const pz = pinch.current;
    if (pz && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const w = Math.min(Math.max((pz.vb.w * pz.dist) / dist, MIN_W), fullView(ratioRef.current).w);
      const h = w * ratioRef.current;
      const ux = pz.vb.x + ((pz.mid.x - rect.left) / rect.width) * pz.vb.w; // the map point that started under the fingers
      const uy = pz.vb.y + ((pz.mid.y - rect.top) / rect.height) * pz.vb.h;
      apply(clamp({ x: ux - ((mid.x - rect.left) / rect.width) * w, y: uy - ((mid.y - rect.top) / rect.height) * h, w, h }));
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) {
      e.currentTarget.setPointerCapture(e.pointerId); // only a real drag takes the pointer, so plain clicks still reach the district
      stopFly();
    }
    d.moved = true;
    apply(clamp({ ...d.vb, x: d.vb.x - (dx / rect.width) * d.vb.w, y: d.vb.y - (dy / rect.height) * d.vb.h }));
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const rest = [...pointers.current.values()][0];
    if (rest && drag.current) drag.current = { x: rest.x, y: rest.y, vb: vbRef.current, moved: true }; // one finger left: keep panning from here
    else if (!rest) window.setTimeout(() => (drag.current = null), 0);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const pan = (fx: number, fy: number) => {
      e.preventDefault();
      const base = flyTarget.current ?? vbRef.current;
      flyTo({ ...base, x: base.x + fx * base.w, y: base.y + fy * base.h }, 180);
    };
    switch (e.key) {
      case "+": case "=": e.preventDefault(); return zoomStep(1 / 1.6);
      case "-": case "_": e.preventDefault(); return zoomStep(1.6);
      case "0": e.preventDefault(); return reset();
      case "f": case "F": e.preventDefault(); return void toggleFullscreen();
      case "ArrowLeft": return pan(-0.2, 0);
      case "ArrowRight": return pan(0.2, 0);
      case "ArrowUp": return pan(0, -0.2);
      case "ArrowDown": return pan(0, 0.2);
      case "Escape": if (farmId || trail.length) { e.preventDefault(); close(); } return;
    }
  };
  const guardClick = (fn: () => void) => () => {
    if (drag.current?.moved) return;
    fn();
  };

  /** One clickable layer of areas: districts, or the sectors, cells or villages inside what is open. */
  const renderLayer = (level: Unit["level"], items: { name: string; d: string; cx: number; cy: number }[], parents: string[], sub: string, label: boolean) => {
    const counts = items.map((u) => stats.get(keyOf(...parents, u.name))?.farms.length ?? 0);
    const top = Math.max(...counts, 0);
    const openHere = trail.length > level ? trail[level] : null;
    return (
      <g key={`layer${level}`}>
        {items.map((u, i) => {
          const isSel = openHere === u.name;
          const isHover = hover?.level === level && hover.name === u.name && hover.sub === sub;
          const fade = level === 0 ? trail.length > 0 && !isSel : trail.length > level + 1 && !isSel;
          return (
            <path
              key={u.name + i}
              d={u.d}
              fillRule="evenodd"
              fill={shade(counts[i], level === 0 ? max : top)}
              fillOpacity={fade ? 0.45 : 1}
              stroke={isSel ? "#1E1B4B" : level === 0 ? "#fff" : "#B9C0CE"}
              strokeWidth={isSel ? 2 : level === 0 ? 0.8 : 0.7}
              vectorEffect="non-scaling-stroke"
              tabIndex={0}
              role="button"
              aria-label={`${u.name}, ${sub}: ${counts[i]} farm${counts[i] === 1 ? "" : "s"}`}
              className="cursor-pointer outline-none transition-[filter] duration-150 focus-visible:brightness-90"
              style={{ filter: isHover || isSel ? (level === 0 ? "brightness(0.9) drop-shadow(0 2px 3px rgba(30,27,75,.35))" : "brightness(0.93)") : undefined }}
              onPointerEnter={(e) => { moveCursor(e); setHover(unitFor(level, u.name, u, parents, sub)); }}
              onPointerMove={moveCursor}
              onPointerLeave={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (drag.current?.moved) return;
                toggle(level, u.name, u.d);
              }}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(level, u.name, u.d))}
            />
          );
        })}
        {label &&
          items.map((u, i) => {
            const box = boxOf(u.d);
            const fits = (box.maxX - box.minX) * pxPerUnit > u.name.length * 5.4;
            const show = level === 0 ? trail.length === 0 && (k < 0.55 || counts[i] > 0 || hover?.name === u.name) : fits || counts[i] > 0 || hover?.name === u.name;
            if (!show) return null;
            return (
              <text key={`t${u.name}${i}`} x={u.cx} y={u.cy - 10 * k} textAnchor="middle" fontSize={11 * k} fontWeight={700} fill="#1E1B4B" stroke="#fff" strokeWidth={3 * k} paintOrder="stroke" pointerEvents="none">
                {u.name}
              </text>
            );
          })}
      </g>
    );
  };

  const layers: React.ReactNode[] = [renderLayer(0, DISTRICTS, [], "Rwanda", trail.length === 0)];
  if (district && sectorList) {
    layers.push(renderLayer(1, sectorList, [district.name], `${district.name} District`, trail.length === 1));
    if (sector?.cells) {
      layers.push(renderLayer(2, sector.cells, [district.name, sector.name], `${sector.name} Sector`, trail.length === 2));
      if (cell?.villages) layers.push(renderLayer(3, cell.villages, [district.name, sector.name, cell.name], `${cell.name} Cell`, trail.length >= 3));
    }
  }

  const unitLabel = (u: Unit) => LEVELS[u.level];
  const noun = ["district", "sector", "cell", "village"];

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div
          ref={boxRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label="Farm map. Keys: plus and minus zoom, arrows move, 0 shows all of Rwanda, F toggles fullscreen, Escape goes back."
          className={`select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
            fullscreen
              ? `${pseudoFs ? "fixed inset-0 z-[100]" : "relative"} h-screen w-screen max-w-none rounded-none bg-white`
              : "relative mx-auto aspect-[664/586] w-full max-w-[620px] rounded-2xl bg-gradient-to-b from-indigo-50/40 to-white"
          }`}
        >
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
            role="img"
            aria-label="Map of Rwanda showing AgriSense farms. Click a district to open its sectors, a sector to open its cells and a cell to open its villages. Scroll to zoom, drag to move."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={guardClick(() => (farmId ? setFarmId(null) : trail.length && goTo(trail.length - 1)))}
          >
            {layers}
            <path d={PROVINCE_OUTLINES} fill="none" stroke="#64748B" strokeWidth={1.1} vectorEffect="non-scaling-stroke" pointerEvents="none" />
            {gpsFarms.map((farm) => {
              const [x, y] = project(Number(farm.longitude), Number(farm.latitude));
              const active = farmId === farm.id;
              return (
                <circle
                  key={farm.id}
                  cx={x}
                  cy={y}
                  r={(active ? 8 : 5.5) * Math.max(k, MIN_K)}
                  fill={soilColor(String(farm.soilType))}
                  stroke="#fff"
                  strokeWidth={1.8 * Math.max(k, MIN_K)}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (drag.current?.moved) return;
                    setFarmId(farm.id);
                  }}
                >
                  <title>{`${farm.name} · ${farm.soilType}`}</title>
                </circle>
              );
            })}
          </svg>

          {trail.length > 0 && (
            <nav aria-label="Map location" className="absolute left-3 top-3 flex max-w-[calc(100%-5rem)] flex-wrap items-center gap-x-1 rounded-xl border bg-white/95 px-2 py-1 text-xs shadow-md backdrop-blur">
              <button type="button" onClick={reset} className="rounded px-1 py-0.5 font-medium text-gray-500 hover:text-[#4338CA]">Rwanda</button>
              {trail.map((name, i) => (
                <span key={name + i} className="flex items-center gap-1">
                  <span className="text-gray-300">›</span>
                  <button type="button" onClick={() => goTo(i + 1)} className={`rounded px-1 py-0.5 font-medium hover:text-[#4338CA] ${i === trail.length - 1 ? "text-gray-900" : "text-gray-500"}`}>{name}</button>
                </span>
              ))}
            </nav>
          )}
          {loadingSectors && <p className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs text-gray-500 shadow">Loading sectors…</p>}

          <div role="toolbar" aria-label="Map controls" aria-orientation="vertical" className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border bg-white/95 shadow-md backdrop-blur">
            {(
              [
                { icon: Plus, label: "Zoom in (+)", on: () => zoomStep(1 / 1.6), off: !canZoomIn },
                { icon: Minus, label: "Zoom out (−)", on: () => zoomStep(1.6), off: !canZoomOut },
                { icon: Home, label: "Show all of Rwanda (0)", on: reset, off: trail.length === 0 && !canZoomOut && !farmId, gap: true },
                ...(trail.length ? [{ icon: CornerLeftUp, label: "Back one level (Esc)", on: close }] : []),
                ...(gpsFarms.length ? [{ icon: Crosshair, label: "Zoom to all farms with a location", on: showFarms }] : []),
                { icon: fullscreen ? Minimize2 : Maximize2, label: fullscreen ? "Exit full screen (F)" : "Full screen (F)", on: () => void toggleFullscreen(), gap: true },
              ] as { icon: typeof Plus; label: string; on: () => void; off?: boolean; gap?: boolean }[]
            ).map(({ icon: Icon, label, on, off, gap }) => (
              <button
                key={label}
                type="button"
                onClick={on}
                disabled={off}
                aria-label={label.replace(/ \(.*\)$/, "")}
                title={label}
                className={`flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-indigo-50 hover:text-[#4338CA] focus-visible:bg-indigo-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300 ${gap ? "border-t" : ""}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {fullscreen && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl border bg-white/95 px-3 py-1.5 text-xs text-gray-500 shadow-md backdrop-blur">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: "rgba(67,56,202,0.3)" }} />Few
                <span className="ml-1 h-3 w-3 rounded-sm" style={{ background: "rgba(67,56,202,1)" }} />Most farms
              </span>
              {Object.entries({ Loamy: "#B45309", Clay: "#BE123C", Sandy: "#CA8A04", Alluvial: "#0F766E" }).map(([soil, color]) => (
                <span key={soil} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{soil}</span>
              ))}
            </div>
          )}

          <AnimatePresence>
            {(selectedFarm ? anchor : hover && !drag.current?.moved ? cursor : null) && (
              <motion.div
                key={selectedFarm ? selectedFarm.id : hover!.key}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`absolute z-10 w-60 rounded-2xl border border-indigo-100 bg-white p-3.5 text-sm shadow-xl ${selectedFarm ? "" : "pointer-events-none"}`}
                style={(() => {
                  // A clicked farm's card sits by its dot; the hover card follows the pointer and stays clear of it.
                  const at = selectedFarm ? anchor! : cursor;
                  return {
                    left: Math.min(Math.max(selectedFarm ? at.x - 120 : at.x + 16, 8), Math.max(size.w - 248, 8)),
                    top: at.y > size.h * 0.55 ? Math.max(at.y - (selectedFarm ? 190 : 170), 8) : Math.min(at.y + 18, Math.max(size.h - 200, 8)),
                  };
                })()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {selectedFarm && (
                  <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {selectedFarm ? (
                  <>
                    <p className="pr-6 font-semibold text-gray-900">{selectedFarm.name}</p>
                    <p className="text-xs text-gray-500">{selectedFarm.ownerName || "Unknown farmer"}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div><dt className="text-gray-400">Soil</dt><dd className="font-semibold capitalize">{String(selectedFarm.soilType)}</dd></div>
                      <div><dt className="text-gray-400">Size</dt><dd className="font-semibold">{Number(selectedFarm.size) ? `${Number(selectedFarm.size).toLocaleString("en-US")} m²` : "Not recorded"}</dd></div>
                      <div className="col-span-2"><dt className="text-gray-400">Place</dt><dd className="font-semibold">{[selectedFarm.village, selectedFarm.sector, selectedFarm.district].filter(Boolean).join(", ")}</dd></div>
                    </dl>
                  </>
                ) : (
                  <>
                    <p className="pr-6 font-semibold text-gray-900">{hover!.name}</p>
                    <p className="text-xs text-gray-500">{unitLabel(hover!)} · {hover!.sub}</p>
                    {stats.get(hover!.key) ? (
                      (() => {
                        const s = stats.get(hover!.key)!;
                        return (
                          <>
                            <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-lg bg-gray-50 py-1.5"><dd className="text-base font-bold">{s.farms.length}</dd><dt className="text-gray-400">Farms</dt></div>
                              <div className="rounded-lg bg-gray-50 py-1.5"><dd className="text-base font-bold">{s.farmers}</dd><dt className="text-gray-400">Farmers</dt></div>
                              <div className="rounded-lg bg-gray-50 py-1.5"><dd className="text-base font-bold">{(s.areaM2 / HECTARE).toFixed(1)}</dd><dt className="text-gray-400">Hectares</dt></div>
                            </dl>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(s.soils).map(([soil, n]) => (
                                <span key={soil} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: soilColor(soil) }}>{soil} · {n}</span>
                              ))}
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <EmptyState art="pin" title="Farms here will appear on the map" compact />
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: "rgba(67,56,202,0.3)" }} />
            Few farms
            <span className="ml-1 h-3 w-3 rounded-sm" style={{ background: "rgba(67,56,202,1)" }} />
            Most farms
          </span>
          {Object.entries({ Loamy: "#B45309", Clay: "#BE123C", Sandy: "#CA8A04", Alluvial: "#0F766E" }).map(([soil, color]) => (
            <span key={soil} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {soil}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Click a district to open its sectors, then a sector for its cells and a cell for its villages. Scroll or use + / − to zoom, drag to move. Boundaries: geoBoundaries (CC BY 4.0).
        </p>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{farms.length}</p><p className="text-[11px] text-gray-500">Farms</p></div>
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{byDistrict.size}</p><p className="text-[11px] text-gray-500">Districts</p></div>
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{(totalArea / HECTARE).toFixed(1)}</p><p className="text-[11px] text-gray-500">Hectares</p></div>
        </div>

        <AnimatePresence mode="wait">
          {panelUnit ? (
            <motion.div key={panelUnit.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#4338CA]" />
                <p className="font-semibold text-gray-900">{panelUnit.name}</p>
                <span className="text-xs text-gray-500">{unitLabel(panelUnit)} · {panelUnit.sub}</span>
              </div>
              {panelStats ? (
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-gray-500">Farms</dt><dd className="font-semibold">{panelStats.farms.length}</dd></div>
                    <div><dt className="text-xs text-gray-500">Farmers</dt><dd className="font-semibold">{panelStats.farmers}</dd></div>
                    <div><dt className="text-xs text-gray-500">Area</dt><dd className="font-semibold">{(panelStats.areaM2 / HECTARE).toFixed(2)} ha</dd></div>
                    <div><dt className="text-xs text-gray-500">With GPS</dt><dd className="font-semibold">{panelStats.withGps} of {panelStats.farms.length}</dd></div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(panelStats.soils).map(([soil, n]) => (
                      <span key={soil} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: soilColor(soil) }}>{soil} · {n}</span>
                    ))}
                  </div>
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
                    {panelStats.farms.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof f.latitude === "number" && typeof f.longitude === "number") {
                              const [x, y] = project(Number(f.longitude), Number(f.latitude));
                              flyTo({ x: x - W / 8, y: y - (W / 4) * ratioRef.current / 2, w: W / 4, h: (W / 4) * ratioRef.current });
                              setFarmId(f.id);
                            }
                          }}
                          className="flex w-full justify-between gap-2 rounded px-1 py-0.5 text-left transition hover:bg-white"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="shrink-0 text-gray-400">{f.village || f.sector || "—"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState art="pin" title="Farms here will appear on the map" compact />
              )}
            </motion.div>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-dashed p-4 text-sm text-gray-500">
              Point at an area to preview it, click to open it and see the {noun[Math.min(trail.length + 1, 3)]}s inside. Any district, sector, cell or village can be picked, even without farms.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-3 space-y-1.5">
          {[...byDistrict.entries()]
            .sort((a, b) => b[1].farms.length - a[1].farms.length)
            .map(([key, s]) => {
              const d = DISTRICTS.find((x) => keyOf(x.name) === key);
              const name = d?.name ?? s.farms[0]?.district ?? key;
              const active = trail.length === 1 && trail[0] === name;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (d ? toggle(0, name, d.d) : undefined)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  <span className="w-24 shrink-0 truncate text-gray-700">{name}</span>
                  <span className="h-2 flex-1 rounded-full bg-gray-100">
                    <motion.span className="block h-2 rounded-full bg-[#4338CA]" initial={{ width: 0 }} animate={{ width: `${(s.farms.length / (max || 1)) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right font-semibold text-gray-800">{s.farms.length}</span>
                </button>
              );
            })}
        </div>
        {unmatched.length > 0 && <p className="mt-3 text-xs text-amber-700">District name not recognised on the map: {unmatched.join(", ")}. Check the spelling on those farms.</p>}
      </div>
    </div>
  );
}
