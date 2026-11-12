import { useMemo, useState } from "react";
import { motion } from "framer-motion";

/* ------------------------------ People waffle ------------------------------ */

export interface WaffleItem {
  id: string;
  group: string;
  color: string;
  dim?: boolean;
  dashed?: boolean;
  label: string;
}

/** One square per person, grouped by role. A dashed outline marks someone still pending. */
export function PeopleWaffle({ items, legend }: { items: WaffleItem[]; legend: Array<{ group: string; color: string; count: number }> }) {
  const [hover, setHover] = useState<string | null>(null);
  const cols = 10;
  return (
    <div>
      <div className="mx-auto grid max-w-[300px] gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.map((it, i) => (
          <motion.span
            key={it.id}
            title={it.label}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: hover && hover !== it.group ? 0.2 : it.dim ? 0.45 : 1, scale: 1 }}
            transition={{ delay: i * 0.015, type: "spring", stiffness: 300, damping: 18 }}
            className="aspect-square w-full rounded-md"
            style={{
              background: it.dashed ? "transparent" : it.color,
              border: it.dashed ? `2px dashed ${it.color}` : undefined,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {legend.map((l) => (
          <button
            key={l.group}
            type="button"
            onMouseEnter={() => setHover(l.group)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
            {l.group} <span className="font-semibold text-gray-900">{l.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Soil strata ------------------------------- */

export interface Stratum {
  name: string;
  color: string;
  m2: number;
  farms: number;
}

/** A cross-section of the land we serve: layer thickness is the share of recorded area for each soil type. */
export function SoilStrata({ layers }: { layers: Stratum[] }) {
  const total = layers.reduce((s, l) => s + l.m2, 0) || 1;
  const H = 250;
  const tops = useMemo(() => {
    let y = 18;
    return layers.map((l) => {
      const h = Math.max((l.m2 / total) * (H - 18), 26);
      const top = y;
      y += h;
      return { top, h };
    });
  }, [layers, total]);
  const full = tops.length ? tops[tops.length - 1].top + tops[tops.length - 1].h : H;

  return (
    <svg viewBox={`0 0 300 ${Math.max(full + 8, H)}`} className="h-auto w-full" role="img" aria-label="Soil types by area">
      <defs>
        {layers.map((l, i) => (
          <pattern key={l.name} id={`soil-${i}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform={`rotate(${i * 25})`}>
            <rect width="10" height="10" fill={l.color} />
            <circle cx="2.5" cy="2.5" r="1.1" fill="#fff" opacity="0.28" />
            <circle cx="7.5" cy="7" r="0.8" fill="#000" opacity="0.18" />
          </pattern>
        ))}
      </defs>
      <path d="M0 14 q 12 -10 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 v 6 H0z" fill="#86EFAC" />
      {layers.map((l, i) => (
        <motion.g
          key={l.name}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.15, type: "spring", stiffness: 160, damping: 18 }}
        >
          <rect x={0} y={tops[i].top} width={150} height={tops[i].h} fill={`url(#soil-${i})`} rx={i === layers.length - 1 ? 8 : 0} />
          <text x={162} y={tops[i].top + tops[i].h / 2 - 3} fontSize={13} fontWeight={700} fill="#111827" style={{ textTransform: "capitalize" }}>
            {l.name}
          </text>
          <text x={162} y={tops[i].top + tops[i].h / 2 + 13} fontSize={11} fill="#6B7280">
            {(l.m2 / 10000).toFixed(1)} ha · {Math.round((l.m2 / total) * 100)}% · {l.farms} farm{l.farms === 1 ? "" : "s"}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

/* ------------------------------ Size strip plot ----------------------------- */

export interface SizeDot {
  id: string;
  lane: string;
  m2: number;
  color: string;
  label: string;
}

const LOG_MIN = Math.log10(1000);
const LOG_MAX = Math.log10(100000);

/** Each farm is a dot on a log scale of area, one lane per district, with the district median marked. */
export function SizeStrip({ dots }: { dots: SizeDot[] }) {
  const lanes = [...new Set(dots.map((d) => d.lane))];
  const laneH = 58;
  const left = 104;
  const width = 560;
  const H = lanes.length * laneH + 44;
  const x = (m2: number) => left + ((Math.log10(Math.min(Math.max(m2, 1000), 100000)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (width - left - 16);
  const ticks = [1000, 5000, 10000, 50000, 100000];

  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="h-auto w-full" role="img" aria-label="Farm sizes by district">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={6} y2={H - 28} stroke="#E5E7EB" strokeDasharray="3 4" />
          <text x={x(t)} y={H - 10} textAnchor="middle" fontSize={12} fill="#6B7280">
            {`${t / 10000} ha`}
          </text>
        </g>
      ))}
      {lanes.map((lane, li) => {
        const inLane = dots.filter((d) => d.lane === lane).sort((a, b) => a.m2 - b.m2);
        const sizes = inLane.map((d) => d.m2);
        const median = sizes.length ? (sizes.length % 2 ? sizes[(sizes.length - 1) / 2] : (sizes[sizes.length / 2 - 1] + sizes[sizes.length / 2]) / 2) : 0;
        const cy = 22 + li * laneH + laneH / 2 - 12;
        return (
          <g key={lane}>
            <text x={left - 12} y={cy + 4} textAnchor="end" fontSize={14} fontWeight={700} fill="#111827">
              {lane}
            </text>
            <line x1={left} x2={width - 16} y1={cy} y2={cy} stroke="#F3F4F6" strokeWidth={14} strokeLinecap="round" />
            <line x1={x(median)} x2={x(median)} y1={cy - 15} y2={cy + 15} stroke="#111827" strokeWidth={2} />
            {inLane.map((d, i) => (
              <motion.circle
                key={d.id}
                cx={x(d.m2)}
                cy={cy + (i % 2 === 0 ? -1 : 1) * Math.min(i, 3) * 2.5}
                fill={d.color}
                stroke="#fff"
                strokeWidth={2}
                initial={{ r: 0 }}
                animate={{ r: 8 }}
                transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 300, damping: 14 }}
              >
                <title>{d.label}</title>
              </motion.circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ----------------------------- Activity calendar ---------------------------- */

const CELL = 14;
const GAP = 3;

/** Last 16 weeks of platform events, one square per day, darker when busier. */
export function ActivityCalendar({ counts, today }: { counts: Record<string, number>; today: Date }) {
  const weeks = 16;
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7));
  const days: Array<{ key: string; date: Date; col: number; row: number }> = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const diff = Math.round((d.getTime() - start.getTime()) / 86400000);
    days.push({ key: d.toLocaleDateString("en-CA"), date: new Date(d), col: Math.floor(diff / 7), row: (d.getDay() + 6) % 7 });
  }
  const max = Math.max(1, ...days.map((d) => counts[d.key] || 0));
  const shade = (n: number) => (n === 0 ? "#EEF0F4" : `rgba(67,56,202,${(0.25 + 0.75 * (n / max)).toFixed(2)})`);
  const cols = days[days.length - 1].col + 1;
  const months: Array<{ col: number; label: string }> = [];
  days.forEach((d) => {
    if (d.date.getDate() <= 7 && d.row === 0) months.push({ col: d.col, label: d.date.toLocaleString("en-GB", { month: "short" }) });
  });

  return (
    <div>
      <svg viewBox={`0 0 ${cols * (CELL + GAP) + 28} ${7 * (CELL + GAP) + 22}`} className="h-auto w-full" role="img" aria-label="Platform activity per day">
        {months.map((m) => (
          <text key={`${m.col}-${m.label}`} x={28 + m.col * (CELL + GAP)} y={10} fontSize={10} fill="#6B7280">
            {m.label}
          </text>
        ))}
        {["Mon", "Wed", "Fri"].map((l, i) => (
          <text key={l} x={0} y={22 + i * 2 * (CELL + GAP) + 11} fontSize={9} fill="#9CA3AF">
            {l}
          </text>
        ))}
        {days.map((d) => {
          const n = counts[d.key] || 0;
          return (
            <motion.rect
              key={d.key}
              x={28 + d.col * (CELL + GAP)}
              y={16 + d.row * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={3}
              fill={shade(n)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: d.col * 0.02 }}
            >
              <title>{`${d.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}: ${n} event${n === 1 ? "" : "s"}`}</title>
            </motion.rect>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------------------------- Funnel --------------------------------- */

export interface FunnelStep {
  label: string;
  value: number;
}

/** Drop-off from sign-up to a working farm. Each bar is as wide as the people who got that far. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const prev = i === 0 ? null : steps[i - 1].value;
        const kept = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-gray-700">{s.label}</span>
              <span className="text-gray-500">
                <span className="font-bold text-gray-900">{s.value}</span>
                {kept !== null && <span className="ml-1.5">{kept}% of previous</span>}
              </span>
            </div>
            <div className="h-7 rounded-lg bg-gray-100">
              <motion.div
                className="h-7 rounded-lg"
                style={{ background: `linear-gradient(90deg, #6366F1, #4338CA)`, opacity: 1 - i * 0.12 }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.9, delay: i * 0.12, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Hour profile ------------------------------- */

/** When people are on the platform: events per hour of day, busiest hour highlighted. */
export function HourProfile({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const peak = hours.indexOf(Math.max(...hours));
  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {hours.map((n, h) => (
          <motion.div
            key={h}
            title={`${String(h).padStart(2, "0")}:00 · ${n} event${n === 1 ? "" : "s"}`}
            className="flex-1 rounded-t"
            style={{ background: h === peak && n > 0 ? "#4338CA" : "#C7D2FE" }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((n / max) * 100, n ? 6 : 2)}%` }}
            transition={{ delay: h * 0.02, duration: 0.5 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}
