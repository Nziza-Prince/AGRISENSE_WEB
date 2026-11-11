import { motion } from "framer-motion";
import CountUp from "react-countup";
import { CheckCircle2, Clock, Hourglass, XCircle, type LucideIcon } from "lucide-react";
import type { AdminSeasonPass, SeasonPassStatus } from "@/api";

type Summary = Partial<Record<SeasonPassStatus, { count: number; amount: number }>>;

const STEPS: Array<{ key: SeasonPassStatus; label: string; hint: string; icon: LucideIcon; color: string }> = [
  { key: "awaiting_payment", label: "Not paid yet", hint: "Farmer has a code", icon: Hourglass, color: "#64748B" },
  { key: "submitted", label: "To confirm", hint: "Waiting for you", icon: Clock, color: "#D97706" },
  { key: "paid", label: "Paid", hint: "Farm unlocked", icon: CheckCircle2, color: "#059669" },
  { key: "rejected", label: "Rejected", hint: "Farmer told why", icon: XCircle, color: "#DC2626" },
];

/** The life of a season pass from code to money in. Click a step to filter the list below. */
export function PaymentFlow({ summary, active, onPick }: { summary: Summary; active: string; onPick: (s: SeasonPassStatus) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STEPS.map((s, i) => {
        const v = summary[s.key] ?? { count: 0, amount: 0 };
        const on = active === s.key;
        return (
          <motion.button
            key={s.key}
            type="button"
            onClick={() => onPick(s.key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className={`relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm ${on ? "ring-2" : ""}`}
            style={on ? { ["--tw-ring-color" as string]: s.color } : undefined}
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} />
            <span className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.key === "submitted" && v.count > 0 ? "animate-pulse" : ""}`} style={{ color: s.color }} />
            </span>
            <span className="mt-2 block text-3xl font-bold text-gray-900">
              <CountUp end={v.count} duration={1} />
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              {v.amount ? `${v.amount.toLocaleString("en-US")} RWF · ` : ""}
              {s.hint}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Confirmed money by month, as a smooth area, from the paid passes. */
export function RevenueTimeline({ passes }: { passes: AdminSeasonPass[] }) {
  const paid = passes.filter((p) => p.status === "paid" && p.paidAt);
  const byMonth = new Map<string, number>();
  for (const p of paid) {
    const d = new Date(p.paidAt as string);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(k, (byMonth.get(k) || 0) + p.amount);
  }
  const rows = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">No confirmed payments yet. Revenue appears here once you mark a payment as paid.</p>;
  }
  const max = Math.max(...rows.map(([, v]) => v));
  return (
    <div className="flex h-40 items-end gap-3">
      {rows.map(([month, v], i) => (
        <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-700">{v.toLocaleString("en-US")}</span>
          <motion.div
            className="w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400"
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((v / max) * 100, 8)}%` }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
          />
          <span className="text-[11px] text-gray-500">{month}</span>
        </div>
      ))}
    </div>
  );
}
