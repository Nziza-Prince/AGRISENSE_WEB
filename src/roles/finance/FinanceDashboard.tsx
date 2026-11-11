import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  HandCoins,
  Loader2,
  Scale,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import FinanceShell from "./FinanceShell";
import { Badge, Panel, StatCard } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { FINANCE_ACCENT } from "./config";
import {
  formatCompactDate,
  formatMonth,
  ghostMethods,
  ghostMonths,
  formatRwf,
  paymentMethodColor,
  paymentMethodLabel,
  statusBadgeColor,
  toDateInput,
} from "./format";
import {
  ApiError,
  financeService,
  type FinanceCategoryTotal,
  type FinanceDashboard,
  type FinanceRangePreset,
} from "@/api";

const PIE_COLORS = ["#164E63", "#0F766E", "#B45309", "#BE123C", "#1D4ED8", "#7C3AED", "#334155"];

function Breakdown({ title, rows }: { title: string; rows: FinanceCategoryTotal[] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const ring = rows.length ? rows : [{ categoryId: "ghost", name: "", amount: 1, color: "#E5E7EB" }];
  return (
    <Panel title={title}>
      {(
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ring} dataKey="amount" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
                  {ring.map((entry, index) => (
                    <Cell key={entry.categoryId} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {rows.length > 0 && <Tooltip formatter={(value) => formatRwf(Number(value))} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {rows.map((row, index) => (
              <div key={row.categoryId} className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: row.color || PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {row.name}
                </span>
                <span className="font-medium">
                  {formatRwf(row.amount)}
                  <span className="ml-1 text-gray-400">{total ? `${Math.round((row.amount / total) * 100)}%` : ""}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

const FinanceDashboard = () => {
  const [preset, setPreset] = useState<FinanceRangePreset>("month");
  const [from, setFrom] = useState(toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(toDateInput());
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Finance | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await financeService.getDashboard({
          preset,
          from: preset === "custom" ? from : undefined,
          to: preset === "custom" ? to : undefined,
        });
        if (active) setData(res);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load finance dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [preset, from, to]);

  const chartData = useMemo(
    () =>
      (data?.incomeVsExpenses?.length ? data.incomeVsExpenses : ghostMonths()).map((row) => ({
        ...row,
        label: formatMonth(row.period),
      })),
    [data],
  );

  const net = data?.totals.netCashFlow ?? 0;
  const farmer = data?.farmerPayments;
  const methods = (data?.paymentMethods || []).filter((m) => m.moneyIn || m.moneyOut || m.onHand);

  return (
    <FinanceShell
      title="Finance overview"
      subtitle="All money in, all money out and farmer payments, in RWF."
    >
      <div className="mb-5">
        <DateRangeBar
          preset={preset}
          from={from}
          to={to}
          onPreset={setPreset}
          onCustom={(nextFrom, nextTo) => {
            setPreset("custom");
            setFrom(nextFrom);
            setTo(nextTo);
          }}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading finance data…
        </div>
      ) : (
        <>
          {(data?.totals.pendingCount ?? 0) > 0 && (
            <Link
              to="/finance/transactions"
              className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              <Clock className="h-4 w-4" />
              {data?.totals.pendingCount} record{data?.totals.pendingCount === 1 ? "" : "s"} on hold (
              {formatRwf(data?.totals.pendingAmount)}). They are not counted until recorded.
            </Link>
          )}

          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Money on hand, all time"
              value={formatRwf(data?.totals.currentBalance)}
              delta={`${formatRwf(data?.totals.lifetimeIncome)} in, ${formatRwf(data?.totals.lifetimeExpenses)} out`}
              accent={FINANCE_ACCENT}
            />
            <StatCard
              icon={ArrowUpRight}
              label="Money in, this period"
              value={formatRwf(data?.totals.totalIncome)}
              deltaPositive
              accent="#0F766E"
            />
            <StatCard
              icon={ArrowDownRight}
              label="Money out, this period"
              value={formatRwf(data?.totals.totalExpenses)}
              deltaPositive={false}
              accent="#BE123C"
            />
            <StatCard
              icon={Scale}
              label="Net, this period"
              value={formatRwf(net)}
              delta={net >= 0 ? "More came in than went out" : "More went out than came in"}
              deltaPositive={net >= 0}
              accent={FINANCE_ACCENT}
            />
          </div>

          <Panel title="Farmer payments" className="mb-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-medium text-emerald-800">Collected and recorded</p>
                <p className="mt-1 text-xl font-bold text-emerald-900">{formatRwf(farmer?.recordedInBooks.amount)}</p>
                <p className="text-xs text-emerald-700">{farmer?.recordedInBooks.count ?? 0} season passes</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-medium text-amber-800">Awaiting confirmation</p>
                <p className="mt-1 text-xl font-bold text-amber-900">{formatRwf(farmer?.submitted.amount)}</p>
                <p className="text-xs text-amber-700">{farmer?.submitted.count ?? 0} farmer{farmer?.submitted.count === 1 ? "" : "s"} say they paid</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-600">Requested, not yet paid</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatRwf(farmer?.awaitingPayment.amount)}</p>
                <p className="text-xs text-gray-500">{farmer?.awaitingPayment.count ?? 0} open requests</p>
              </div>
              <Link
                to="/finance/farmer-payments"
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <HandCoins className="h-4 w-4" />
                See every farmer payment
              </Link>
            </div>
          </Panel>

          <div className="mb-5 grid gap-4 xl:grid-cols-5">
            <Panel title="Money in vs money out, by month" className="xl:col-span-3">
              {(
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} domain={data?.incomeVsExpenses?.length ? [0, "auto"] : [0, 100000]} />
                      <Tooltip formatter={(value) => formatRwf(Number(value))} />
                      <Area type="monotone" dataKey="income" stroke="#0F766E" fill="#0F766E22" name="Money in" />
                      <Area type="monotone" dataKey="expenses" stroke="#BE123C" fill="#BE123C18" name="Money out" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Where the money is" className="xl:col-span-2">
              {(
                <div className="space-y-3">
                  {(methods.length ? methods : ghostMethods()).map((m) => (
                    <div key={m.method} className="rounded-xl border border-gray-100 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <Badge color={paymentMethodColor(m.method)}>{paymentMethodLabel(m.method)}</Badge>
                        <p className="text-sm font-bold text-gray-900">{formatRwf(m.onHand)}</p>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        This period: <span className="text-emerald-700">+{formatRwf(m.moneyIn)}</span> in,{" "}
                        <span className="text-rose-700">−{formatRwf(m.moneyOut)}</span> out
                      </p>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400">
                    The large figure is what should be held that way, all time (money in minus money out).
                  </p>
                </div>
              )}
            </Panel>
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Money in by category"
              rows={data?.incomeByCategory || []}
            />
            <Breakdown
              title="Money out by category"
              rows={data?.expensesByCategory || []}
            />
          </div>

          <Panel title="Latest records">
            {(data?.recentTransactions || []).length === 0 ? (
              <EmptyState art="ledger" title="Your records will appear here" text="Start with Record money in or Record money out. Past entries can carry their real date." compact />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Way of payment</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b last:border-0">
                        <td className="py-2.5 whitespace-nowrap text-gray-500">{formatCompactDate(txn.occurredAt)}</td>
                        <td className="py-2.5">
                          <p className="font-medium text-gray-800">{txn.description}</p>
                          <p className="text-xs text-gray-400">
                            {txn.category?.name}
                            {txn.counterparty ? ` · ${txn.counterparty}` : ""}
                          </p>
                        </td>
                        <td className="py-2.5">
                          <Badge color={paymentMethodColor(txn.paymentMethod)}>{paymentMethodLabel(txn.paymentMethod)}</Badge>
                        </td>
                        <td className="py-2.5">
                          <Badge color={statusBadgeColor(txn.status)}>
                            {txn.status === "APPROVED" ? "Recorded" : txn.status === "PENDING" ? "On hold" : txn.status}
                          </Badge>
                        </td>
                        <td
                          className={`py-2.5 text-right font-semibold whitespace-nowrap ${
                            txn.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {txn.type === "INCOME" ? "+" : "−"}
                          {formatRwf(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </FinanceShell>
  );
};

export default FinanceDashboard;
