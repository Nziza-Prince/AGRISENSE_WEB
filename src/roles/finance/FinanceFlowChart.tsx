import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Panel } from "../ui";
import { formatRwf } from "./format";
import type { FinanceSeries } from "@/api";

const IN = "#0F766E";
const OUT = "#BE123C";
const NET = "#1D4ED8";

const GRAIN_LABEL = { day: "day", week: "week", month: "month" } as const;

function parse(period: string) {
  const [y, m, d] = period.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function axisLabel(period: string, grain: FinanceSeries["granularity"]) {
  const date = parse(period);
  if (grain === "month") return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fullLabel(period: string, grain: FinanceSeries["granularity"]) {
  const date = parse(period);
  if (grain === "month") return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (grain === "week") {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const short = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${short(date)} to ${short(end)} ${end.getFullYear()}`;
  }
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const compact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
};

type Row = {
  period: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  running: number;
  count: number;
};

function Tip({ active, payload, grain }: { active?: boolean; payload?: Array<{ payload: Row }>; grain: FinanceSeries["granularity"] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-800">{fullLabel(row.period, grain)}</p>
      <p style={{ color: IN }}>Money in: {formatRwf(row.income)}</p>
      <p style={{ color: OUT }}>Money out: {formatRwf(row.expenses)}</p>
      <p className="font-semibold text-gray-800">
        {row.net >= 0 ? "Left over" : "Overspent"}: {formatRwf(Math.abs(row.net))}
      </p>
      <p style={{ color: NET }}>Running total: {formatRwf(row.running)}</p>
      <p className="mt-1 text-gray-400">{row.count} record{row.count === 1 ? "" : "s"}</p>
    </div>
  );
}

export function FinanceFlowChart({ series, loading }: { series?: FinanceSeries; loading: boolean }) {
  const grain = series?.points?.length ? series.granularity : "week";

  const flat = !(series?.points || []).some((p) => p.income || p.expenses);

  const data = useMemo(() => {
    let running = 0;
    const base: FinanceSeries["points"] = series?.points?.length
      ? series.points
      : Array.from({ length: 8 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (7 - i) * 7);
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return { period: iso, income: 0, expenses: 0, net: 0, count: 0 };
        });
    return base.map<Row>((p) => {
      running += p.net;
      return { ...p, label: axisLabel(p.period, grain), running };
    });
  }, [series, grain]);

  return (
    <Panel title="How money moved" className="mb-5">
      <p className="-mt-2 mb-4 text-xs text-gray-500">Money in and out for each {GRAIN_LABEL[grain]}, following the filters below.</p>

      {loading && data.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-500">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Drawing the chart…
        </div>
      ) : (
        <>
          <div className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} syncId="finance-flow" margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={compact} width={44} tickLine={false} axisLine={false} domain={flat ? [0, 100000] : [0, "auto"]} />
                <Tooltip content={<Tip grain={grain} />} cursor={{ fill: "#0f172a08" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Money in" fill={IN} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Money out" fill={OUT} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Running total (money in minus money out, adding up from the start of this view)
          </p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} syncId="finance-flow" margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="runFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NET} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={NET} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={18} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: NET }} tickFormatter={compact} width={44} tickLine={false} axisLine={false} domain={flat ? [-50000, 50000] : ["auto", "auto"]} />
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                <Tooltip content={() => null} />
                <Area type="stepAfter" dataKey="running" stroke={NET} strokeWidth={2} fill="url(#runFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}
