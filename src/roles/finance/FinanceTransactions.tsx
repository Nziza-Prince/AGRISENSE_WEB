import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Plus, X } from "lucide-react";
import FinanceShell from "./FinanceShell";
import { useFinanceAccess } from "./useFinanceAccess";
import { Badge, PaginationControls, Panel } from "../ui";
import { Figure, Figures } from "./Figure";
import { DateRangeBar } from "./DateRangeBar";
import { FinanceFlowChart } from "./FinanceFlowChart";
import { FINANCE_ACCENT } from "./config";
import {
  PAYMENT_METHODS,
  canEditStatus,
  formatCompactDate,
  formatDateTime,
  formatRwf,
  paymentMethodColor,
  paymentMethodLabel,
  statusBadgeColor,
  toDateInput,
} from "./format";
import {
  ApiError,
  financeService,
  type FinanceCategory,
  type FinancePaymentMethod,
  type FinanceRangePreset,
  type FinanceSeries,
  type FinanceTransaction,
  type FinanceTransactionStatus,
  type FinanceTransactionType,
} from "@/api";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

const emptyForm = {
  type: "INCOME" as FinanceTransactionType,
  amount: "",
  occurredAt: toDateInput(),
  description: "",
  categoryId: "",
  paymentMethod: "CASH" as FinancePaymentMethod,
  counterparty: "",
  reference: "",
  notes: "",
  hold: false,
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInput(date);
};

const FinanceTransactions = () => {
  const [preset, setPreset] = useState<FinanceRangePreset>("month");
  const [from, setFrom] = useState(toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(toDateInput());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sums, setSums] = useState({ income: 0, expenses: 0, net: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [series, setSeries] = useState<FinanceSeries | undefined>();
  const [rows, setRows] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [type, setType] = useState<"ALL" | FinanceTransactionType>("ALL");
  const [status, setStatus] = useState<"ALL" | FinanceTransactionStatus>("ALL");
  const [method, setMethod] = useState<"ALL" | FinancePaymentMethod>("ALL");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { readOnly } = useFinanceAccess();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [viewing, setViewing] = useState<FinanceTransaction | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    document.title = "Money in & out | Finance | AGRISENSE";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await financeService.listCategories();
        setCategories(res.categories || []);
      } catch {
        // table load still proceeds
      }
    })();
  }, []);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeService.listTransactions({
        page: nextPage,
        limit: PAGE_SIZE,
        type: type === "ALL" ? undefined : type,
        status: status === "ALL" ? undefined : status,
        paymentMethod: method === "ALL" ? undefined : method,
        categoryId: categoryId || undefined,
        search: search.trim() || undefined,
        preset,
        from: preset === "custom" ? from : undefined,
        to: preset === "custom" ? to : undefined,
      });
      setRows(res.transactions || []);
      setPage(res.page || nextPage);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      setSums(res.totals || { income: 0, expenses: 0, net: 0 });
      setSeries(res.series);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, from, to, type, status, method, categoryId]);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.isActive !== false && c.kind === form.type),
    [categories, form.type],
  );

  const openCreate = (kind: FinanceTransactionType) => {
    setEditing(null);
    setFormError(null);
    setForm({ ...emptyForm, type: kind });
    setModalOpen(true);
  };

  // "Record the starting capital" from the Overview opens the form filled in; the real date is left for the CFO.
  useEffect(() => {
    if (searchParams.get("startingCapital") !== "1" || readOnly || categories.length === 0) return;
    const capital = categories.find((c) => c.name === "Starting capital");
    setEditing(null);
    setFormError(null);
    setForm({
      ...emptyForm,
      type: "INCOME",
      amount: "2000000",
      occurredAt: "",
      description: "Starting capital from the team's contributions",
      categoryId: capital?.id || "",
      notes: "The money the team started the company with. We take from it for activities.",
    });
    setModalOpen(true);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories, readOnly]);

  const openEdit = (txn: FinanceTransaction) => {
    setViewing(null);
    setEditing(txn);
    setFormError(null);
    setForm({
      type: (txn.type as FinanceTransactionType) || "EXPENSE",
      amount: String(txn.amount || ""),
      occurredAt: toDateInput(txn.occurredAt),
      description: txn.description || "",
      categoryId: txn.categoryId,
      paymentMethod: (txn.paymentMethod as FinancePaymentMethod) || "CASH",
      counterparty: txn.counterparty || "",
      reference: txn.reference || "",
      notes: txn.notes || "",
      hold: false,
    });
    setModalOpen(true);
  };

  const save = async (addAnother = false) => {
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.categoryId || !Number.isFinite(amount) || amount < 1) {
      setFormError("Amount, description and category are required.");
      return;
    }
    if (!form.occurredAt) {
      setFormError("Choose the date the money moved.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setInfo(null);
    try {
      const payload = {
        type: form.type,
        amount: Math.round(amount),
        occurredAt: form.occurredAt,
        description: form.description.trim(),
        categoryId: form.categoryId,
        paymentMethod: form.paymentMethod,
        counterparty: form.counterparty.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editing) {
        await financeService.updateTransaction(editing.id, payload);
        setInfo("Record updated. The change is kept in the audit trail.");
        setModalOpen(false);
      } else {
        await financeService.createTransaction({
          ...payload,
          status: form.hold ? ("PENDING" as const) : ("APPROVED" as const),
        });
        setInfo(`${form.type === "INCOME" ? "Money in" : "Money out"} recorded for ${formatCompactDate(form.occurredAt)}.`);
        if (addAnother) {
          // Keep the date, type, method and category: past records usually come in batches.
          setForm((prev) => ({ ...prev, amount: "", description: "", counterparty: "", reference: "", notes: "" }));
        } else {
          setModalOpen(false);
        }
      }
      await load(editing ? page : 1);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  const run = async (task: () => Promise<unknown>, ok: string) => {
    setError(null);
    setInfo(null);
    try {
      await task();
      setInfo(ok);
      setViewing(null);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  const amountPreview = Number(form.amount) > 0 ? formatRwf(Number(form.amount)) : "";
  const isIncome = form.type === "INCOME";

  return (
    <FinanceShell
      title="Money in & out"
      subtitle={
        readOnly
          ? "Every record of money received and money spent. View only: the finance officer records and corrects entries."
          : "Record every franc that comes in or goes out, including past ones. Choose the real date the money moved."
      }
      actions={
        readOnly ? undefined : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openCreate("INCOME")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Record money in
            </button>
            <button
              onClick={() => openCreate("EXPENSE")}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              <Plus className="h-4 w-4" />
              Record money out
            </button>
          </div>
        )
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>
      )}

      <Figures>
        <Figure label="Money in" value={formatRwf(sums.income)} tone="text-emerald-700" />
        <Figure label="Money out" value={formatRwf(sums.expenses)} tone="text-rose-700" />
        <Figure label="Net" value={formatRwf(sums.net)} tone={sums.net < 0 ? "text-rose-700" : "text-gray-900"}>
          <p>Recorded items in this view</p>
        </Figure>
      </Figures>

      <FinanceFlowChart series={series} loading={loading} />

      <Panel>
        <div className="mb-4">
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
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(1);
            }}
            placeholder="Search description, person, reference or notes"
            className="h-10 min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.kind === "INCOME" ? "in" : "out"})
              </option>
            ))}
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "ALL" | FinancePaymentMethod)}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
          >
            <option value="ALL">All ways of payment</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button onClick={() => load(1)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700">
            Search
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["ALL", "All"],
              ["INCOME", "Money in"],
              ["EXPENSE", "Money out"],
            ] as const
          ).map(([item, label]) => (
            <button
              key={item}
              onClick={() => setType(item)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={type === item ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT } : undefined}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-gray-200 sm:block" />
          {(["ALL", "APPROVED", "PENDING", "REJECTED", "CANCELLED"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={status === item ? { backgroundColor: "#111827", color: "#fff", borderColor: "#111827" } : undefined}
            >
              {item === "ALL" ? "Any status" : item === "APPROVED" ? "Recorded" : item === "PENDING" ? "On hold" : item[0] + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Details</th>
                <th className="pb-2 font-medium">Way of payment</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading records…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState art="ledger" title="Your records will appear here" text="Record money in or money out, including past entries, and each one is kept with its date and details." compact />
                  </td>
                </tr>
              ) : (
                rows.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => setViewing(txn)}
                    className="cursor-pointer border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-3 whitespace-nowrap text-gray-500">{formatCompactDate(txn.occurredAt)}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{txn.description}</p>
                      <p className="text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: txn.category?.color || "#94a3b8" }} />
                          {txn.category?.name}
                        </span>
                        {txn.counterparty ? ` · ${txn.type === "INCOME" ? "from" : "to"} ${txn.counterparty}` : ""}
                        {txn.reference ? ` · ${txn.reference}` : ""}
                        {txn.sourceType === "SEASON_PASS" ? " · added automatically" : ""}
                      </p>
                    </td>
                    <td className="py-3">
                      <Badge color={paymentMethodColor(txn.paymentMethod)}>{paymentMethodLabel(txn.paymentMethod)}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge color={statusBadgeColor(txn.status)}>
                        {txn.status === "APPROVED" ? "Recorded" : txn.status === "PENDING" ? "On hold" : txn.status}
                      </Badge>
                    </td>
                    <td className={`py-3 text-right font-semibold whitespace-nowrap ${txn.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
                      {txn.type === "INCOME" ? "+" : "−"}
                      {formatRwf(txn.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          disabled={loading}
          onPageChange={(next) => load(next)}
        />
      </Panel>

      {viewing && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={() => setViewing(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase ${viewing.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
                  {viewing.type === "INCOME" ? "Money in" : "Money out"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{formatRwf(viewing.amount)}</h2>
                <p className="mt-1 text-sm text-gray-600">{viewing.description}</p>
              </div>
              <button onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="divide-y text-sm">
              {(
                [
                  ["Date money moved", formatCompactDate(viewing.occurredAt)],
                  ["Category", viewing.category?.name || "—"],
                  ["Way of payment", paymentMethodLabel(viewing.paymentMethod)],
                  [viewing.type === "INCOME" ? "Received from" : "Paid to", viewing.counterparty || "—"],
                  ["Receipt or reference", viewing.reference || "—"],
                  ["Status", viewing.status === "APPROVED" ? "Recorded" : viewing.status === "PENDING" ? "On hold" : viewing.status],
                  ["Recorded by", viewing.sourceType === "SEASON_PASS" ? "Added automatically from a confirmed season pass" : getUserDisplayName(viewing.createdBy)],
                  ["Entered in system", formatDateTime(viewing.createdAt)],
                  ...(viewing.cancelledAt ? [["Cancelled", `${formatDateTime(viewing.cancelledAt)}${viewing.cancelReason ? `: ${viewing.cancelReason}` : ""}`]] : []),
                  ...(viewing.rejectedAt ? [["Rejected", `${formatDateTime(viewing.rejectedAt)}${viewing.rejectionReason ? `: ${viewing.rejectionReason}` : ""}`]] : []),
                ] as Array<[string, string]>
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>
            {viewing.notes && (
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Notes</p>
                {viewing.notes}
              </div>
            )}
            {!readOnly && (
              <div className="mt-6 flex flex-wrap gap-2">
                {canEditStatus(viewing.status) && (
                  <button onClick={() => openEdit(viewing)} className="rounded-lg border px-3 py-2 text-sm font-semibold">
                    Edit
                  </button>
                )}
                {viewing.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => run(() => financeService.approveTransaction(viewing.id), "Recorded.")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                    >
                      Record it
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Why is this rejected? (optional)") || undefined;
                        run(() => financeService.rejectTransaction(viewing.id, reason), "Rejected.");
                      }}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(viewing.status === "PENDING" || viewing.status === "APPROVED") && (
                  <button
                    onClick={() => {
                      const reason = window.prompt("Why is this cancelled? (optional)") || undefined;
                      run(() => financeService.cancelTransaction(viewing.id, reason), "Cancelled. The history is kept.");
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Cancel record
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setModalOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? "Edit record" : isIncome ? "Record money in" : "Record money out"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editing
                    ? "Every change is kept in the audit trail with the old and new values."
                    : "You can record past money too: pick the date it really moved."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{formError}</div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(
                [
                  ["INCOME", "Money in"],
                  ["EXPENSE", "Money out"],
                ] as const
              ).map(([item, label]) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: item, categoryId: "" }))}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    form.type === item
                      ? item === "INCOME"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-rose-600 bg-rose-50 text-rose-800"
                      : "text-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase text-gray-400">
                  Amount (RWF)
                  <input
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="0"
                    className="mt-1 h-11 w-full rounded-lg border px-3 text-base font-semibold text-gray-800"
                  />
                  <span className="mt-1 block h-4 text-[11px] normal-case text-gray-400">{amountPreview}</span>
                </label>
                <label className="text-xs font-semibold uppercase text-gray-400">
                  Date money moved
                  <input
                    value={form.occurredAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, occurredAt: e.target.value }))}
                    type="date"
                    max={toDateInput()}
                    className="mt-1 h-11 w-full rounded-lg border px-3 text-sm text-gray-800"
                  />
                  <span className="mt-1 flex gap-1.5 normal-case">
                    {(
                      [
                        ["Today", 0],
                        ["Yesterday", 1],
                        ["A week ago", 7],
                      ] as const
                    ).map(([label, days]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, occurredAt: daysAgo(days) }))}
                        className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-50"
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                </label>
              </div>

              <label className="text-xs font-semibold uppercase text-gray-400">
                What was it for
                <input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={isIncome ? "For example: Season pass, Jean Pierre" : "For example: Sensor parts, Kigali"}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>

              <label className="text-xs font-semibold uppercase text-gray-400">
                Category
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Way of payment</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {PAYMENT_METHODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: item.id }))}
                      className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold ${
                        form.paymentMethod === item.id ? "border-[#164E63] bg-[#164E63]/10 text-[#164E63]" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                      <span className="block text-[10px] font-normal text-gray-400">{item.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase text-gray-400">
                  {isIncome ? "Received from" : "Paid to"}
                  <input
                    value={form.counterparty}
                    onChange={(e) => setForm((prev) => ({ ...prev, counterparty: e.target.value }))}
                    placeholder="Person or company"
                    className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                  />
                </label>
                <label className="text-xs font-semibold uppercase text-gray-400">
                  Receipt or reference no.
                  <input
                    value={form.reference}
                    onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                    placeholder="Receipt, invoice or MoMo ID"
                    className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                  />
                </label>
              </div>

              <label className="text-xs font-semibold uppercase text-gray-400">
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Anything worth remembering about this payment"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-800"
                />
              </label>

              {!editing && (
                <label className="flex items-start gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.hold}
                    onChange={(e) => setForm((prev) => ({ ...prev, hold: e.target.checked }))}
                  />
                  <span>
                    Keep on hold. Held records do not count in totals until you record them.
                  </span>
                </label>
              )}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Close
              </button>
              {!editing && (
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                >
                  Save and add another
                </button>
              )}
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: FINANCE_ACCENT }}
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FinanceShell>
  );
};

export default FinanceTransactions;
