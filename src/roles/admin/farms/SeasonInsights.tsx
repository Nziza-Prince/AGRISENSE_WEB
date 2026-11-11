import { motion } from "framer-motion";
import { CalendarCheck, ClipboardList, Leaf, Sprout } from "lucide-react";
import type { SeasonRecord } from "@/api";
import { METRICS, orderSeasons } from "./shared";

const numeric = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

function Spark({ points }: { points: Array<number | null> }) {
  const vals = points.filter((p): p is number => p !== null);
  if (vals.length < 2) return <span className="text-[11px] text-gray-400">{vals.length ? "One reading so far" : "No readings"}</span>;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => (p === null ? null : [i * step, h - 4 - ((p - min) / span) * (h - 8)] as const)).filter(Boolean) as Array<readonly [number, number]>;
  const d = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full">
      <motion.path d={d} fill="none" stroke="#4338CA" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.8} fill={i === coords.length - 1 ? "#4338CA" : "#fff"} stroke="#4338CA" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

/** What the history adds up to: seasons worked, crops grown, visits made, and how each reading moved. */
export default function SeasonInsights({ records }: { records: SeasonRecord[] }) {
  const ordered = orderSeasons(records);
  const chronological = [...ordered].reverse();
  const crops = [...new Set(ordered.map((r) => r.selectedCrop).filter(Boolean))] as string[];
  const visits = ordered.reduce((n, r) => n + r.visits.length, 0);
  const lastMeasured = ordered.map((r) => r.measuredAt).filter(Boolean).sort().pop() ?? null;

  const tiles = [
    { icon: CalendarCheck, label: "Seasons worked", value: String(ordered.length), color: "#4338CA" },
    { icon: Leaf, label: "Crops grown", value: crops.length ? crops.join(", ") : "None recorded", color: "#0F766E" },
    { icon: ClipboardList, label: "Field visits", value: String(visits), color: "#B45309" },
    { icon: Sprout, label: "Last measured", value: lastMeasured ? new Date(lastMeasured).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never", color: "#BE123C" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border bg-white p-4 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${t.color}1A`, color: t.color }}>
              <t.icon className="h-4 w-4" />
            </span>
            <p className="mt-2 line-clamp-2 text-xl font-bold text-gray-900">{t.value}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-900">How the readings moved, season by season</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => {
            const series = chronological.map((r) => numeric(r[m.key]));
            const latest = [...series].reverse().find((v) => v !== null) ?? null;
            const prev = series.filter((v) => v !== null);
            const delta = prev.length >= 2 ? (prev[prev.length - 1] as number) - (prev[prev.length - 2] as number) : null;
            return (
              <div key={m.key as string} className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-gray-500">{m.label}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {latest === null ? "—" : `${latest}${m.unit}`}
                  </span>
                </div>
                <Spark points={series} />
                {delta !== null && (
                  <p className={`text-[11px] font-semibold ${delta === 0 ? "text-gray-400" : delta > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(Math.round(delta * 100) / 100)}{m.unit} since the previous season
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
