import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "react-countup";
import { Loader2, MapPin, Ruler, Sprout, Users } from "lucide-react";
import { Panel } from "../../ui";
import { EmptyState } from "@/components/EmptyState";
import { farmRecordsService, type AdminFarm, type Farm } from "@/api";
import RwandaFarmMap from "../RwandaFarmMap";
import TagSearch, { type TagGroup } from "../orgs/TagSearch";
import FarmPlots from "./FarmPlots";
import { checksFor, formatArea, scoreOf, sizeM2, soilColor } from "./shared";

function Ring({ value }: { value: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const color = value >= 100 ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <motion.circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">
        {value}
      </text>
    </svg>
  );
}

export default function FarmDirectory({ onOpen }: { onOpen: (farm: AdminFarm) => void }) {
  const [farms, setFarms] = useState<AdminFarm[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, string | null>>({ district: null, soil: null, data: null });

  useEffect(() => {
    farmRecordsService
      .listFarms()
      .then((res) => setFarms(res.farms))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load farms."));
  }, []);

  const stats = useMemo(() => {
    const list = farms ?? [];
    const farmers = new Set(list.map((f) => f.userId)).size;
    const area = list.reduce((s, f) => s + sizeM2(f), 0);
    const districts = new Set(list.map((f) => f.district)).size;
    const avgScore = list.length ? Math.round(list.reduce((s, f) => s + scoreOf(f), 0) / list.length) : 0;
    return { farmers, area, districts, avgScore, incomplete: list.filter((f) => scoreOf(f) < 100).length };
  }, [farms]);

  const groups: TagGroup[] = useMemo(() => {
    const list = farms ?? [];
    const countBy = (pick: (f: AdminFarm) => string) =>
      Object.entries(list.reduce<Record<string, number>>((a, f) => ({ ...a, [pick(f)]: (a[pick(f)] || 0) + 1 }), {}));
    return [
      { key: "district", label: "district", options: countBy((f) => f.district).map(([v, n]) => ({ value: v, label: v, count: n })) },
      { key: "soil", label: "soil", options: countBy((f) => f.soilType.toLowerCase()).map(([v, n]) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1), count: n, dot: soilColor(v) })) },
      {
        key: "data",
        label: "data",
        options: [
          { value: "complete", label: "Complete", count: list.filter((f) => scoreOf(f) === 100).length, dot: "#10B981" },
          { value: "missing", label: "Needs details", count: list.filter((f) => scoreOf(f) < 100).length, dot: "#F59E0B" },
        ],
      },
    ];
  }, [farms]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (farms ?? []).filter(
      (f) =>
        (!picked.district || f.district === picked.district) &&
        (!picked.soil || f.soilType.toLowerCase() === picked.soil) &&
        (!picked.data || (picked.data === "complete" ? scoreOf(f) === 100 : scoreOf(f) < 100)) &&
        (!q || [f.name, f.ownerName, f.farmCode, f.village, f.sector, f.district].join(" ").toLowerCase().includes(q)),
    );
  }, [farms, picked, query]);

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!farms)
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading farms
      </div>
    );

  const kpis = [
    { label: "Farms", value: farms.length, icon: Sprout, color: "#4338CA" },
    { label: "Farmers", value: stats.farmers, icon: Users, color: "#0F766E" },
    { label: "Hectares recorded", value: Math.round((stats.area / 10000) * 10) / 10, decimals: 1, icon: Ruler, color: "#B45309" },
    { label: "Districts", value: stats.districts, icon: MapPin, color: "#BE123C" },
  ];
  const needy = [...farms].filter((f) => scoreOf(f) < 100).sort((a, b) => scoreOf(a) - scoreOf(b));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${k.color}1A`, color: k.color }}>
              <k.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="mt-3 block text-3xl font-bold text-gray-900">
              <CountUp end={k.value} decimals={k.decimals ?? 0} duration={1} />
            </span>
            <span className="text-xs text-gray-500">{k.label}</span>
          </motion.div>
        ))}
      </div>

      <Panel title="Where the farms are">
        <RwandaFarmMap farms={farms as unknown as Farm[]} />
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Panel title="Farms drawn to scale" className="lg:col-span-3">
          <FarmPlots farms={farms} onOpen={onOpen} />
        </Panel>
        <Panel title="Record completeness" className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <Ring value={stats.avgScore} />
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{stats.incomplete} of {farms.length}</span> farms still miss details. Size, soil notes,
              real email, phone, GPS and irrigation are checked.
            </p>
          </div>
          <ul className="mt-4 max-h-[250px] space-y-2 overflow-y-auto pr-1">
            {needy.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onOpen(f)}
                  className="w-full rounded-xl border border-gray-100 px-3 py-2 text-left transition hover:border-[#4338CA] hover:bg-indigo-50/40"
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-900">
                    <span className="truncate">{f.farmCode ? `${f.farmCode} · ` : ""}{f.name}</span>
                    <span className="text-xs text-gray-400">{scoreOf(f)}%</span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {checksFor(f).filter((c) => !c.ok).map((c) => (
                      <span key={c.key} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        {c.label}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
            {needy.length === 0 && <li className="text-sm text-emerald-700">Every farm has all details.</li>}
          </ul>
        </Panel>
      </div>

      <Panel title="All farms">
        <div className="mb-4">
          <TagSearch
            query={query}
            onQuery={setQuery}
            groups={groups}
            selected={picked}
            onSelect={(g, v) => setPicked((cur) => ({ ...cur, [g]: v }))}
            placeholder="Search farm, farmer, code or village, or filter by district, soil and data…"
          />
        </div>
        <p className="mb-3 text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{shown.length}</span> of {farms.length} farms
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((f, i) => {
              const checks = checksFor(f);
              const m2 = sizeM2(f);
              return (
                <motion.button
                  key={f.id}
                  layout
                  type="button"
                  onClick={() => onOpen(f)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400">
                        {f.farmCode || "No farm ID"}
                        {f.isActive === false && " · inactive"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-gray-900">{f.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{f.ownerName}</p>
                    </div>
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: soilColor(f.soilType) }} title={`${f.soilType} soil`} />
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-gray-400">Size</dt>
                      <dd className={`mt-0.5 font-medium ${m2 ? "text-gray-900" : "text-gray-300"}`}>{m2 ? formatArea(m2) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400">Soil</dt>
                      <dd className="mt-0.5 font-medium capitalize text-gray-900">{f.soilType}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400">Water</dt>
                      <dd className={`mt-0.5 truncate font-medium ${f.irrigationMethod ? "text-gray-900" : "text-gray-300"}`}>{f.irrigationMethod || "—"}</dd>
                    </div>
                  </dl>

                  <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{[f.village, f.sector, f.district].filter(Boolean).join(", ")}</span>
                  </p>

                  <div className="mt-4">
                    <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                      <motion.div className="h-1 rounded-full bg-[#4338CA]" initial={{ width: 0 }} animate={{ width: `${scoreOf(f)}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      {checks.filter((c) => c.ok).length} of {checks.length} details recorded
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        {shown.length === 0 && <EmptyState art="search" title="No farms match" text="Try clearing a filter." compact />}
      </Panel>
    </div>
  );
}
