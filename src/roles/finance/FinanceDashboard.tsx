import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import FinanceShell from "./FinanceShell";
import { useFinanceAccess } from "./useFinanceAccess";
import { Badge, Panel } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { Figure, Figures } from "./Figure";
import { FINANCE_ACCENT } from "./config";
import {
  formatCompactDate,
  formatMonth,
  ghostMonths,
  formatRwf,
  paymentMethodColor,
  paymentMethodLabel,
  statusBadgeColor,
  toDateInput,
} from "./format";
import { ApiError, financeService, type FinanceDashboard, type FinanceRangePreset } from "@/api";

const FinanceDashboard = () => {
  const { readOnly } = useFinanceAccess();
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
            <Link to="/finance/transactions" className="mb-4 block rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100">
              {data?.totals.pendingCount} record{data?.totals.pendingCount === 1 ? "" : "s"} on hold ({formatRwf(data?.totals.pendingAmount)}), not counted until recorded.
            </Link>
          )}

          <Figures>
            <Figure label="Money left" value={formatRwf(data?.totals.currentBalance)} tone={(data?.totals.currentBalance ?? 0) < 0 ? "text-rose-700" : "text-gray-900"}>
              <p>
                {formatRwf(data?.totals.lifetimeIncome)} in, {formatRwf(data?.totals.lifetimeExpenses)} out, all time
              </p>
              {methods.length > 1 && (
                <p className="flex flex-wrap gap-x-3">
                  {methods.map((m) => (
                    <span key={m.method}>
                      {paymentMethodLabel(m.method)} <span className="font-medium text-gray-700">{formatRwf(m.onHand)}</span>
                    </span>
                  ))}
                </p>
              )}
              {!data?.teamFund.recorded && !readOnly && (
                <Link to="/finance/transactions?startingCapital=1" className="font-medium underline" style={{ color: FINANCE_ACCENT }}>
                  Record the starting capital with its real date
                </Link>
              )}
            </Figure>

            <Figure label="Spent this period" value={formatRwf(data?.totals.totalExpenses)}>
              <p>
                {formatRwf(data?.totals.totalIncome)} received
                {net !== 0 && <span className={net > 0 ? " text-emerald-700" : " text-rose-700"}>{` · net ${net > 0 ? "+" : "−"}${formatRwf(Math.abs(net))}`}</span>}
              </p>
            </Figure>

            <Figure label="Farmer payments to confirm" value={String(farmer?.submitted.count ?? 0)}>
              <p>
                {(farmer?.submitted.count ?? 0) > 0 ? `${formatRwf(farmer?.submitted.amount)} reported paid` : "Nothing waiting"}
                {(farmer?.awaitingPayment.count ?? 0) > 0 && `, ${farmer?.awaitingPayment.count} still unpaid`}
              </p>
              <Link to="/finance/farmer-payments" className="inline-flex items-center gap-1 font-medium" style={{ color: FINANCE_ACCENT }}>
                See farmer payments <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Figure>
          </Figures>

          <Panel title="Money in and out, by month" className="mb-6 shadow-none">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} domain={data?.incomeVsExpenses?.length ? [0, "auto"] : [0, 100000]} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={(value) => formatRwf(Number(value))} />
                  <Bar dataKey="income" fill="#0F766E" name="Money in" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expenses" fill="#BE123C" name="Money out" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0F766E]" />Money in</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#BE123C]" />Money out</span>
            </div>
          </Panel>

          <Panel
            title="Latest records"
            className="shadow-none"
            action={
              <Link to="/finance/transactions" className="text-sm font-medium" style={{ color: FINANCE_ACCENT }}>
                See all
              </Link>
            }
          >
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
                    {data?.recentTransactions.slice(0, 6).map((txn) => (
                      <tr key={txn.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-2.5 text-gray-500">{formatCompactDate(txn.occurredAt)}</td>
                        <td className="py-2.5">
                          <p className="font-medium text-gray-800">{txn.description}</p>
                          <p className="text-xs text-gray-400">
                            {txn.category?.name}
                            {txn.counterparty ? ` · ${txn.counterparty}` : ""}
                          </p>
                        </td>
                        <td className="py-2.5"><Badge color={paymentMethodColor(txn.paymentMethod)}>{paymentMethodLabel(txn.paymentMethod)}</Badge></td>
                        <td className="py-2.5">
                          <Badge color={statusBadgeColor(txn.status)}>
                            {txn.status === "APPROVED" ? "Recorded" : txn.status === "PENDING" ? "On hold" : txn.status}
                          </Badge>
                        </td>
                        <td className={`whitespace-nowrap py-2.5 text-right font-semibold ${txn.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
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
