import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Minus, Plus, Maximize2, X } from "lucide-react";
import type { Farm } from "@/api";
import { DISTRICTS, MAP_BOUNDS, PROVINCE_OUTLINES, project } from "./rwandaMap";

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

/** Bounding box of every district path, read once from the path data. */
const BOXES = new Map(
  DISTRICTS.map((d) => {
    const nums = (d.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      minX = Math.min(minX, nums[i]); maxX = Math.max(maxX, nums[i]);
      minY = Math.min(minY, nums[i + 1]); maxY = Math.max(maxY, nums[i + 1]);
    }
    return [d.name, { minX, minY, maxX, maxY }] as const;
  }),
);

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

const clampVB = (v: VB): VB => {
  const w = Math.min(Math.max(v.w, W / 10), W);
  const h = (w / W) * H;
  const x = Math.min(Math.max(v.x, -W * 0.05), W * 1.05 - w);
  const y = Math.min(Math.max(v.y, -H * 0.05), H * 1.05 - h);
  return { x, y, w, h };
};

type Selection = { kind: "district"; name: string } | { kind: "farm"; id: string } | null;

export default function RwandaFarmMap({ farms }: { farms: Farm[] }) {
  const [sel, setSel] = useState<Selection>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(FULL);
  const vbRef = useRef<VB>(FULL);
  const raf = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 520, h: 460 });
  const drag = useRef<{ x: number; y: number; vb: VB; moved: boolean } | null>(null);

  const apply = useCallback((next: VB) => {
    vbRef.current = next;
    setVb(next);
  }, []);

  const flyTo = useCallback(
    (target: VB) => {
      if (raf.current) cancelAnimationFrame(raf.current);
      const from = vbRef.current;
      const to = clampVB(target);
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / 450, 1);
        const e = 1 - Math.pow(1 - t, 3);
        apply({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply],
  );

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const zoomBy = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const cur = vbRef.current;
      const px = cx ?? cur.x + cur.w / 2;
      const py = cy ?? cur.y + cur.h / 2;
      const w = Math.min(Math.max(cur.w * factor, W / 10), W);
      const h = (w / W) * H;
      apply(clampVB({ x: px - ((px - cur.x) / cur.w) * w, y: py - ((py - cur.y) / cur.h) * h, w, h }));
    },
    [apply],
  );

  // Wheel zoom around the cursor. It has to be a non-passive listener so the page does not scroll as well.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cur = vbRef.current;
      zoomBy(e.deltaY > 0 ? 1.18 : 1 / 1.18, cur.x + ((e.clientX - rect.left) / rect.width) * cur.w, cur.y + ((e.clientY - rect.top) / rect.height) * cur.h);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const byDistrict = useMemo(() => {
    const map = new Map<string, DistrictStats>();
    for (const farm of farms) {
      const key = norm(farm.district);
      const stats = map.get(key) ?? { farms: [], withGps: 0, areaM2: 0, farmers: 0, soils: {} };
      stats.farms.push(farm);
      if (typeof farm.latitude === "number" && typeof farm.longitude === "number") stats.withGps += 1;
      stats.areaM2 += Number(farm.size) || 0;
      const soil = (farm.soilType || "Unknown").toString();
      stats.soils[soil] = (stats.soils[soil] || 0) + 1;
      map.set(key, stats);
    }
    for (const stats of map.values()) {
      stats.farmers = new Set(stats.farms.map((f) => norm(f.ownerEmail) || norm(f.ownerName) || f.id)).size;
    }
    return map;
  }, [farms]);

  const max = Math.max(0, ...[...byDistrict.values()].map((s) => s.farms.length));
  const unmatched = [...byDistrict.keys()].filter((k) => !DISTRICTS.some((d) => norm(d.name) === k));
  const gpsFarms = farms.filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number");
  const totalArea = farms.reduce((sum, f) => sum + (Number(f.size) || 0), 0);

  const selectedDistrict = sel?.kind === "district" ? DISTRICTS.find((d) => d.name === sel.name) : undefined;
  const selectedFarm = sel?.kind === "farm" ? farms.find((f) => f.id === sel.id) : undefined;
  const panelDistrict = selectedDistrict ?? (hover ? DISTRICTS.find((d) => d.name === hover) : undefined);
  const panelStats = panelDistrict ? byDistrict.get(norm(panelDistrict.name)) : undefined;

  const focusDistrict = useCallback(
    (name: string) => {
      const box = BOXES.get(name);
      if (!box) return;
      const pad = 36;
      const bw = box.maxX - box.minX + pad * 2;
      const bh = box.maxY - box.minY + pad * 2;
      const w = Math.max(bw, (bh * W) / H, W / 5);
      const h = (w / W) * H;
      flyTo({ x: (box.minX + box.maxX) / 2 - w / 2, y: (box.minY + box.maxY) / 2 - h / 2, w, h });
      setSel({ kind: "district", name });
    },
    [flyTo],
  );

  const reset = () => {
    setSel(null);
    flyTo(FULL);
  };

  // Where the popup sits, in pixels inside the map box, so it follows pan and zoom.
  const anchor = useMemo(() => {
    let ax: number | null = null;
    let ay: number | null = null;
    if (selectedFarm && selectedFarm.longitude != null && selectedFarm.latitude != null) {
      [ax, ay] = project(Number(selectedFarm.longitude), Number(selectedFarm.latitude));
    } else if (selectedDistrict) {
      ax = selectedDistrict.cx;
      ay = selectedDistrict.cy;
    }
    if (ax == null || ay == null) return null;
    const scale = Math.min(size.w / vb.w, size.h / vb.h);
    const offX = (size.w - vb.w * scale) / 2;
    const offY = (size.h - vb.h * scale) / 2;
    return { x: offX + (ax - vb.x) * scale, y: offY + (ay - vb.y) * scale };
  }, [selectedDistrict, selectedFarm, vb, size]);

  const k = vb.w / W; // keeps dots and labels the same size on screen while zooming
  const zoomed = k < 0.55;

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, vb: vbRef.current, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) e.currentTarget.setPointerCapture(e.pointerId); // only a real drag takes the pointer, so plain clicks still reach the district
    d.moved = true;
    const rect = e.currentTarget.getBoundingClientRect();
    apply(clampVB({ ...d.vb, x: d.vb.x - (dx / rect.width) * d.vb.w, y: d.vb.y - (dy / rect.height) * d.vb.h }));
  };
  const onPointerUp = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };
  const guardClick = (fn: () => void) => () => {
    if (drag.current?.moved) return;
    fn();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div ref={boxRef} className="relative mx-auto aspect-[664/586] w-full max-w-[620px] select-none overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50/40 to-white">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
            role="img"
            aria-label="Map of Rwanda showing AgriSense farms by district. Click a district for details, scroll to zoom, drag to move."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={guardClick(() => sel && setSel(null))}
          >
            {DISTRICTS.map((district) => {
              const count = byDistrict.get(norm(district.name))?.farms.length ?? 0;
              const isSel = sel?.kind === "district" && sel.name === district.name;
              const isHover = hover === district.name;
              return (
                <path
                  key={district.name}
                  d={district.d}
                  fill={shade(count, max)}
                  stroke={isSel ? "#1E1B4B" : "#fff"}
                  strokeWidth={(isSel ? 2.2 : 0.8) * Math.max(k, 0.35)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${district.name}, ${district.province}: ${count} farm${count === 1 ? "" : "s"}`}
                  className="cursor-pointer outline-none transition-[filter] duration-150 focus-visible:brightness-90"
                  style={{ filter: isHover || isSel ? "brightness(0.9) drop-shadow(0 2px 3px rgba(30,27,75,.35))" : undefined }}
                  onPointerEnter={() => setHover(district.name)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (drag.current?.moved) return;
                    if (isSel) reset();
                    else focusDistrict(district.name);
                  }}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), focusDistrict(district.name))}
                />
              );
            })}
            <path d={PROVINCE_OUTLINES} fill="none" stroke="#64748B" strokeWidth={1.1 * Math.max(k, 0.35)} pointerEvents="none" />
            {DISTRICTS.filter((d) => zoomed || (byDistrict.get(norm(d.name))?.farms.length ?? 0) > 0 || hover === d.name).map((d) => (
              <text
                key={d.name}
                x={d.cx}
                y={d.cy - 10 * k}
                textAnchor="middle"
                fontSize={11 * k}
                fontWeight={700}
                fill="#1E1B4B"
                stroke="#fff"
                strokeWidth={3 * k}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {d.name}
              </text>
            ))}
            {gpsFarms.map((farm) => {
              const [x, y] = project(Number(farm.longitude), Number(farm.latitude));
              const active = sel?.kind === "farm" && sel.id === farm.id;
              return (
                <circle
                  key={farm.id}
                  cx={x}
                  cy={y}
                  r={(active ? 8 : 5.5) * Math.max(k, 0.3)}
                  fill={soilColor(String(farm.soilType))}
                  stroke="#fff"
                  strokeWidth={1.8 * Math.max(k, 0.3)}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (drag.current?.moved) return;
                    setSel({ kind: "farm", id: farm.id });
                  }}
                >
                  <title>{`${farm.name} · ${farm.soilType}`}</title>
                </circle>
              );
            })}
          </svg>

          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border bg-white/95 shadow-md backdrop-blur">
            {[
              { icon: Plus, label: "Zoom in", on: () => zoomBy(1 / 1.5) },
              { icon: Minus, label: "Zoom out", on: () => zoomBy(1.5) },
              { icon: Maximize2, label: "Show all of Rwanda", on: reset },
            ].map(({ icon: Icon, label, on }) => (
              <button key={label} type="button" onClick={on} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-indigo-50 hover:text-[#4338CA]">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <AnimatePresence>
            {anchor && (selectedDistrict || selectedFarm) && (
              <motion.div
                key={selectedFarm ? selectedFarm.id : selectedDistrict!.name}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="absolute z-10 w-60 rounded-2xl border border-indigo-100 bg-white p-3.5 text-sm shadow-xl"
                style={{
                  left: Math.min(Math.max(anchor.x - 120, 8), Math.max(size.w - 248, 8)),
                  top: anchor.y > size.h * 0.55 ? Math.max(anchor.y - 190, 8) : Math.min(anchor.y + 18, Math.max(size.h - 200, 8)),
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={reset} aria-label="Close" className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
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
                    <p className="pr-6 font-semibold text-gray-900">{selectedDistrict!.name}</p>
                    <p className="text-xs text-gray-500">{selectedDistrict!.province}</p>
                    {byDistrict.get(norm(selectedDistrict!.name)) ? (
                      (() => {
                        const s = byDistrict.get(norm(selectedDistrict!.name))!;
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
          Click a district or a dot. Scroll or use + / − to zoom, drag to move. Boundaries: geoBoundaries (CC BY 4.0).
        </p>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{farms.length}</p><p className="text-[11px] text-gray-500">Farms</p></div>
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{byDistrict.size}</p><p className="text-[11px] text-gray-500">Districts</p></div>
          <div className="rounded-xl bg-gray-50 px-2 py-3"><p className="text-xl font-bold text-gray-900">{(totalArea / HECTARE).toFixed(1)}</p><p className="text-[11px] text-gray-500">Hectares</p></div>
        </div>

        <AnimatePresence mode="wait">
          {panelDistrict ? (
            <motion.div key={panelDistrict.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#4338CA]" />
                <p className="font-semibold text-gray-900">{panelDistrict.name}</p>
                <span className="text-xs text-gray-500">{panelDistrict.province}</span>
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
                              flyTo({ x: x - W / 8, y: y - H / 8, w: W / 4, h: H / 4 });
                              setSel({ kind: "farm", id: f.id });
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
              Point at a district to preview it, click to zoom in and pin its details. Any of the 30 districts can be picked, even without farms.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-3 space-y-1.5">
          {[...byDistrict.entries()]
            .sort((a, b) => b[1].farms.length - a[1].farms.length)
            .map(([key, s]) => {
              const name = DISTRICTS.find((d) => norm(d.name) === key)?.name ?? s.farms[0]?.district ?? key;
              const active = sel?.kind === "district" && sel.name === name;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => (active ? reset() : focusDistrict(name))}
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
