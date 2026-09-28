import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { FINANCE_ACCENT, financeLinks } from "./config";
import { downloadCsv, formatCompactDate, formatRwf, toDateInput } from "./format";
import { ApiError, financeService, type FinanceRangePreset, type FinanceReport } from "@/api";

const KINDS = [
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
  { id: "cash-flow", label: "Cash flow" },
  { id: "expense-by-category", label: "Expense by category" },
  { id: "transactions", label: "Transactions" },
] as const;

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
    if (kind === "expense-by-category") {
      downloadCsv(
        `agrisense-${kind}.csv`,
        ["Category", "Amount (RWF)"],
        (report.expensesByCategory || []).map((row) => [row.name, row.amount]),
      );
      return;
    }
    downloadCsv(
      `agrisense-${kind}.csv`,
      ["Date", "Type", "Status", "Description", "Category", "Account", "Counterparty", "Reference", "Amount (RWF)"],
      (report.rows || []).map((row) => [
        formatCompactDate(row.occurredAt),
        row.type,
        row.status,
        row.description,
        row.category?.name || "",
        row.account?.name || "",
        row.counterparty || "",
        row.reference || "",
        row.amount,
      ]),
    );
  };

  return (
    <RoleLayout
      links={financeLinks}
      roleLabel="CFO Portal"
      accent={FINANCE_ACCENT}
      title="Reports"
      subtitle="Filter by period and export CSV for the board pack or bookkeeping."
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
          <p className="text-xs text-gray-500">Income</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatRwf(report?.summary.income)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatRwf(report?.summary.expenses)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Net</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatRwf(report?.summary.net)}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-gray-500">Rows</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{report?.summary.count ?? 0}</p>
        </Panel>
      </div>

      <Panel>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Building report…
          </div>
        ) : kind === "expense-by-category" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(report?.expensesByCategory || []).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-gray-500">
                    No expense data in this period.
                  </td>
                </tr>
              ) : (
                report?.expensesByCategory?.map((row) => (
                  <tr key={row.categoryId} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="py-3 text-right">{formatRwf(row.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(report?.rows || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      No rows in this report.
                    </td>
                  </tr>
                ) : (
                  report?.rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-3 text-gray-500">{formatCompactDate(row.occurredAt)}</td>
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{row.description}</p>
                        <p className="text-xs text-gray-400">
                          {row.account?.name} · {row.category?.name}
                        </p>
                      </td>
                      <td className="py-3 text-gray-600">{row.type}</td>
                      <td className="py-3 text-gray-600">{row.status}</td>
                      <td className="py-3 text-right font-semibold">{formatRwf(row.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default FinanceReports;
