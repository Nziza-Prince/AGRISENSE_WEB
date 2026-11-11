import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import FinanceShell from "./FinanceShell";
import { Panel } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { FINANCE_ACCENT } from "./config";
import { downloadCsv, formatCompactDate, formatMonth, formatRwf, paymentMethodLabel, toDateInput } from "./format";
import { ApiError, financeService, type FinanceRangePreset, type FinanceReport } from "@/api";

const KINDS = [
  { id: "cash-flow", label: "Cash flow" },
  { id: "income", label: "Money in" },
  { id: "expense", label: "Money out" },
  { id: "transactions", label: "Every record" },
] as const;

function CategoryRows({ rows, empty }: { rows: Array<{ categoryId: string; name: string; amount: number; count?: number }>; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-gray-500">{empty}</p>;
  return (
    <div className="space-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.categoryId} className="flex items-center justify-between border-b pb-2 last:border-0">
          <span className="font-medium text-gray-800">
            {row.name}
            {row.count ? <span className="ml-1 text-xs font-normal text-gray-400">×{row.count}</span> : null}
          </span>
          <span className="font-semibold text-gray-700">{formatRwf(row.amount)}</span>
        </div>
      ))}
    </div>
  );
}

const FinanceReports = () => {
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("cash-flow");
  const [preset, setPreset] = useState<FinanceRangePreset>("month");
  const [from, setFrom] = useState(toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(toDateInput());
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Reports | Finance | AGRISENSE";
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeService.getReport({
        kind,
        preset,
        from: preset === "custom" ? from : undefined,
        to: preset === "custom" ? to : undefined,
      });
      setReport(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, preset, from, to]);

  const exportCsv = () => {
    if (!report) return;
    downloadCsv(
      `agrisense-${kind}.csv`,
      ["Date", "Type", "Status", "Description", "Category", "Way of payment", "Person or company", "Reference", "Notes", "Amount (RWF)"],
      (report.rows || []).map((row) => [
        formatCompactDate(row.occurredAt),
        row.type === "INCOME" ? "Money in" : "Money out",
        row.status,
        row.description,
        row.category?.name || "",
        paymentMethodLabel(row.paymentMethod),
        row.counterparty || "",
        row.reference || "",
        row.notes || "",
        row.amount,
      ]),
    );
  };

  return (
    <FinanceShell
      title="Reports"
      subtitle="Pick a period, read the breakdowns and export CSV for the board pack, investors or bookkeeping."
      actions={
        <button
          onClick={exportCsv}
          disabled={!report}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {KINDS.map((item) => (
          <button
            key={item.id}
            onClick={() => setKind(item.id)}
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={
              kind === item.id
                ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT }
                : undefined
            }
          >
            {item.label}
          </button>
        ))}
      </div>
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
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <Panel>
          <p className="text-xs text-gray-500">Money in</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatRwf(report?.summary.income)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Money out</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatRwf(report?.summary.expenses)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Net</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatRwf(report?.summary.net)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Records</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{report?.summary.count ?? 0}</p>
        </Panel>
      </div>

      {!loading && report && (
        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <Panel title="Money in by category">
            <CategoryRows rows={report.incomeByCategory} empty="No money in." />
          </Panel>
          <Panel title="Money out by category">
            <CategoryRows rows={report.expensesByCategory} empty="No money out." />
          </Panel>
          <Panel title="By way of payment">
            <div className="space-y-2 text-sm">
              {report.byMethod.filter((m) => m.moneyIn || m.moneyOut).length === 0 && (
                <p className="py-6 text-center text-gray-500">Nothing in this period.</p>
              )}
              {report.byMethod
                .filter((m) => m.moneyIn || m.moneyOut)
                .map((m) => (
                  <div key={m.method} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="font-medium text-gray-800">{paymentMethodLabel(m.method)}</span>
                    <span className="text-xs text-gray-500">
                      <span className="text-emerald-700">+{formatRwf(m.moneyIn)}</span>{" "}
                      <span className="text-rose-700">−{formatRwf(m.moneyOut)}</span>
                    </span>
                  </div>
                ))}
            </div>
          </Panel>
        </div>
      )}

      {!loading && report && report.byMonth.length > 0 && (
        <Panel title="Month by month" className="mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Money in</th>
                <th className="pb-2 text-right font-medium">Money out</th>
                <th className="pb-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {report.byMonth.map((row) => (
                <tr key={row.period} className="border-b last:border-0">
                  <td className="py-2.5 font-medium text-gray-800">{formatMonth(row.period)}</td>
                  <td className="py-2.5 text-right text-emerald-700">{formatRwf(row.income)}</td>
                  <td className="py-2.5 text-right text-rose-700">{formatRwf(row.expenses)}</td>
                  <td className="py-2.5 text-right font-semibold">{formatRwf(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel title="Records">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Building report…
          </div>
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
                {(report?.rows || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      No records in this report.
                    </td>
                  </tr>
                ) : (
                  report?.rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-3 whitespace-nowrap text-gray-500">{formatCompactDate(row.occurredAt)}</td>
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{row.description}</p>
                        <p className="text-xs text-gray-400">
                          {row.category?.name}
                          {row.counterparty ? ` · ${row.counterparty}` : ""}
                          {row.reference ? ` · ${row.reference}` : ""}
                        </p>
                      </td>
                      <td className="py-3 text-gray-600">{paymentMethodLabel(row.paymentMethod)}</td>
                      <td className="py-3 text-gray-600">{row.status === "APPROVED" ? "Recorded" : row.status === "PENDING" ? "On hold" : row.status}</td>
                      <td className={`py-3 text-right font-semibold whitespace-nowrap ${row.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
                        {row.type === "INCOME" ? "+" : "−"}
                        {formatRwf(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </FinanceShell>
  );
};

export default FinanceReports;
