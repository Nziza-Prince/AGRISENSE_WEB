import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Farm } from "@/api";
import { DISTRICTS, MAP_BOUNDS, PROVINCE_OUTLINES, project } from "../rwandaMap";
import { KIND_META, PROVINCES, provinceKey, provinceStats, type Org } from "./shared";

const centroid = (province: string) => {
  const ds = DISTRICTS.filter((d) => provinceKey(d.province) === provinceKey(province));
  return [ds.reduce((s, d) => s + d.cx, 0) / (ds.length || 1), ds.reduce((s, d) => s + d.cy, 0) / (ds.length || 1)] as const;
};

function shade(n: number) {
  if (n === 0) return "#EEF0F4";
  return `rgba(67,56,202,${Math.min(0.2 + n * 0.22, 0.85).toFixed(2)})`;
}

/**
 * Rwanda by province: shade shows how many approved suppliers serve it, dots are farms (the demand),
 * pins are suppliers at their district. A province with farms and no supplier is flagged as a gap.
 */
export default function OrgCoverageMap({ orgs, farms }: { orgs: Org[]; farms: Farm[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const stats = useMemo(() => provinceStats(orgs, farms), [orgs, farms]);
  const active = stats.find((s) => s.province === hover);
  const gps = farms.filter((f) => typeof f.latitude === "number" && typeof f.longitude === "number");

  return (
    <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <style>{`@keyframes pin-ping{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(3)}}`}</style>
      <svg viewBox={`0 0 ${MAP_BOUNDS.width} ${MAP_BOUNDS.height}`} className="mx-auto h-auto w-full max-w-[520px]" role="img" aria-label="Supplier coverage by province">
        {DISTRICTS.map((d, i) => {
          const s = stats.find((x) => provinceKey(x.province) === provinceKey(d.province));
          const count = s?.suppliers.length ?? 0;
          const isHover = hover && s?.province === hover;
          return (
            <motion.path
              key={d.name}
              d={d.d}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.015 }}
              fill={s?.gap ? "#FEF3C7" : shade(count)}
              stroke={s?.gap ? "#F59E0B" : "#fff"}
              strokeWidth={s?.gap ? 0.9 : 0.6}
              strokeDasharray={s?.gap ? "3 2" : undefined}
              style={{ filter: isHover ? "brightness(0.92)" : undefined, cursor: "pointer" }}
              onMouseEnter={() => s && setHover(s.province)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
        <path d={PROVINCE_OUTLINES} fill="none" stroke="#475569" strokeWidth={1.2} pointerEvents="none" />
        {gps.map((f) => {
          const [x, y] = project(Number(f.longitude), Number(f.latitude));
          return <circle key={f.id} cx={x} cy={y} r={2.6} fill="#0F766E" opacity={0.75} pointerEvents="none" />;
        })}
        {PROVINCES.map((p) => {
          const [x, y] = centroid(p);
          const s = stats.find((st) => st.province === p)!;
          return (
            <g key={p} pointerEvents="none">
              <text x={x} y={y + 22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1E1B4B" stroke="#fff" strokeWidth={3} paintOrder="stroke">
                {p.replace(" Province", "")}
              </text>
              {s.ngos.length > 0 && (
                <g>
                  <circle cx={x + 24} cy={y} r={7} fill="#fff" stroke={KIND_META.NGO.color} strokeWidth={2} />
                  <text x={x + 24} y={y + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={KIND_META.NGO.color}>
                    {s.ngos.length}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {orgs
          .filter((o) => o.kind === "SUPPLIER" && o.district)
          .map((o, i) => {
            const d = DISTRICTS.find((x) => x.name === o.district)!;
            const pending = o.status === "PENDING";
            return (
              <g key={o.id}>
                {pending && (
                  <circle cx={d.cx} cy={d.cy} r={9} fill="#F59E0B" style={{ transformOrigin: `${d.cx}px ${d.cy}px`, animation: "pin-ping 2s ease-out infinite" }} />
                )}
                <motion.g
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.6 + i * 0.1 }}
                >
                  <path
                    d={`M${d.cx} ${d.cy + 2}c-6-8-9-11-9-16a9 9 0 0 1 18 0c0 5-3 8-9 16z`}
                    fill={pending ? "#F59E0B" : KIND_META.SUPPLIER.color}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  <circle cx={d.cx} cy={d.cy - 14} r={3.2} fill="#fff" />
                  <title>{`${o.name} · ${o.district}`}</title>
                </motion.g>
              </g>
            );
          })}
      </svg>

      <div>
        <div className="space-y-2">
          {stats.map((s, i) => (
            <motion.div
              key={s.province}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onMouseEnter={() => setHover(s.province)}
              onMouseLeave={() => setHover(null)}
              className={`rounded-xl border px-3 py-2.5 transition ${
                hover === s.province ? "border-[#4338CA] bg-indigo-50/50" : s.gap ? "border-amber-200 bg-amber-50/60" : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{s.province}</p>
                {s.gap && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> No supplier
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {s.farms} farm{s.farms === 1 ? "" : "s"} · {s.suppliers.length} supplier{s.suppliers.length === 1 ? "" : "s"} · {s.ngos.length} NGO
                {s.ngos.length === 1 ? "" : "s"}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 min-h-[34px] text-xs text-gray-500">
          {active
            ? [...active.suppliers, ...active.ngos].map((o) => o.name).join(" · ") || "Nobody approved serves this province yet."
            : "Shade: approved suppliers serving the province. Teal dots: farms. Pins: suppliers at their district. Purple badge: NGOs."}
        </p>
      </div>
    </div>
  );
}
