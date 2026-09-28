import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
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
import RoleLayout from "../RoleLayout";
import { Badge, Panel, StatCard } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { FINANCE_ACCENT, financeLinks } from "./config";
import {
  accountTypeLabel,
  formatCompactDate,
  formatRwf,
  statusBadgeColor,
  toDateInput,
} from "./format";
import {
  ApiError,
  financeService,
  type FinanceDashboard,
  type FinanceRangePreset,
} from "@/api";

const PIE_COLORS = ["#164E63", "#0F766E", "#B45309", "#BE123C", "#1D4ED8", "#7C3AED", "#334155"];

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
      (data?.incomeVsExpenses || []).map((row) => ({
        ...row,
        label: row.period,
      })),
    [data],
  );

  const pieData = data?.expensesByCategory || [];
  const net = data?.totals.netCashFlow ?? 0;

  return (
    <RoleLayout
      links={financeLinks}
      roleLabel="CFO Portal"
      accent={FINANCE_ACCENT}
      title="Finance overview"
      subtitle="Cash position, income, expenses, and pending items in RWF."
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
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={Wallet}
              label="Current balance"
              value={formatRwf(data?.totals.currentBalance)}
              accent={FINANCE_ACCENT}
            />
            <StatCard
              icon={ArrowUpRight}
              label="Income"
              value={formatRwf(data?.totals.totalIncome)}
              deltaPositive
              accent="#0F766E"
            />
            <StatCard
              icon={ArrowDownRight}
              label="Expenses"
              value={formatRwf(data?.totals.totalExpenses)}
              deltaPositive={false}
              accent="#BE123C"
            />
            <StatCard
              icon={Scale}
              label="Net cash flow"
              value={formatRwf(net)}
              delta={net >= 0 ? "Positive period" : "Negative period"}
              deltaPositive={net >= 0}
              accent={FINANCE_ACCENT}
            />
            <StatCard
              icon={Landmark}
              label="Pending expenses"
              value={formatRwf(data?.totals.pendingExpenses)}
              delta={`${data?.totals.pendingExpenseCount ?? 0} awaiting approval`}
              deltaPositive={false}
              accent="#B45309"
            />
          </div>

          <div className="mb-5 grid gap-4 xl:grid-cols-5">
            <Panel title="Income vs expenses" className="xl:col-span-3">
              {chartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  No posted activity in this period.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                      <Tooltip formatter={(value) => formatRwf(Number(value))} />
                      <Area type="monotone" dataKey="income" stroke="#0F766E" fill="#0F766E22" name="Income" />
                      <Area type="monotone" dataKey="expenses" stroke="#BE123C" fill="#BE123C18" name="Expenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
            <Panel title="Expense breakdown" className="xl:col-span-2">
              {pieData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  No approved expenses in this period.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.categoryId} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRwf(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {pieData.slice(0, 5).map((row, index) => (
                      <div key={row.categoryId} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: row.color || PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          {row.name}
                        </span>
                        <span className="font-medium">{formatRwf(row.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <Panel title="Accounts" className="xl:col-span-2">
              {(data?.accounts || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No accounts yet.</p>
              ) : (
                <div className="space-y-3">
                  {data?.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-400">{accountTypeLabel(account.type)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{formatRwf(account.balance)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Recent transactions" className="xl:col-span-3">
              {(data?.recentTransactions || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b last:border-0">
                          <td className="py-2.5 text-gray-500">{formatCompactDate(txn.occurredAt)}</td>
                          <td className="py-2.5">
                            <p className="font-medium text-gray-800">{txn.description}</p>
                            <p className="text-xs text-gray-400">
                              {txn.account?.name} · {txn.category?.name}
                            </p>
                          </td>
                          <td className="py-2.5">
                            <Badge color={statusBadgeColor(txn.status)}>{txn.status}</Badge>
                          </td>
                          <td
                            className={`py-2.5 text-right font-semibold ${
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
          </div>
        </>
      )}
    </RoleLayout>
  );
};

export default FinanceDashboard;
