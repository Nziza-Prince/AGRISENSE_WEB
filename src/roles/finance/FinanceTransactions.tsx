import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, PaginationControls, Panel } from "../ui";
import { DateRangeBar } from "./DateRangeBar";
import { FINANCE_ACCENT, financeLinks } from "./config";
import {
  canEditStatus,
  formatCompactDate,
  formatRwf,
  statusBadgeColor,
  toDateInput,
} from "./format";
import {
  ApiError,
  financeService,
  type FinanceAccount,
  type FinanceCategory,
  type FinanceRangePreset,
  type FinanceTransaction,
  type FinanceTransactionStatus,
  type FinanceTransactionType,
} from "@/api";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

const emptyForm = {
  type: "EXPENSE" as FinanceTransactionType,
  amount: "",
  occurredAt: toDateInput(),
  description: "",
  accountId: "",
  categoryId: "",
  counterparty: "",
  reference: "",
  notes: "",
  postNow: false,
};

const FinanceTransactions = () => {
  const [preset, setPreset] = useState<FinanceRangePreset>("month");
  const [from, setFrom] = useState(toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(toDateInput());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<FinanceTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [type, setType] = useState<"ALL" | FinanceTransactionType>("ALL");
  const [status, setStatus] = useState<"ALL" | FinanceTransactionStatus>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    document.title = "Transactions | Finance | AGRISENSE";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          financeService.listAccounts(),
          financeService.listCategories(),
        ]);
        setAccounts(accountsRes.accounts || []);
        setCategories(categoriesRes.categories || []);
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
        search: search.trim() || undefined,
        preset,
        from: preset === "custom" ? from : undefined,
        to: preset === "custom" ? to : undefined,
      });
      setRows(res.transactions || []);
      setPage(res.page || nextPage);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
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
  }, [preset, from, to, type, status]);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.isActive !== false && c.kind === form.type),
    [categories, form.type],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      accountId: accounts.find((a) => a.isActive !== false)?.id || "",
    });
    setModalOpen(true);
  };

  const openEdit = (txn: FinanceTransaction) => {
    setEditing(txn);
    setForm({
      type: (txn.type as FinanceTransactionType) || "EXPENSE",
      amount: String(txn.amount || ""),
      occurredAt: toDateInput(txn.occurredAt),
      description: txn.description || "",
      accountId: txn.accountId,
      categoryId: txn.categoryId,
      counterparty: txn.counterparty || "",
      reference: txn.reference || "",
      notes: txn.notes || "",
      postNow: false,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.description.trim() || !form.accountId || !form.categoryId || !Number.isFinite(amount) || amount < 1) {
      setError("Amount, description, account, and category are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const payload = {
        type: form.type,
        amount: Math.round(amount),
        occurredAt: form.occurredAt,
        description: form.description.trim(),
        accountId: form.accountId,
        categoryId: form.categoryId,
        counterparty: form.counterparty.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.postNow ? ("APPROVED" as const) : undefined,
      };
      if (editing) {
        await financeService.updateTransaction(editing.id, payload);
        setInfo("Transaction updated.");
      } else {
        await financeService.createTransaction(payload);
        setInfo("Transaction saved.");
      }
      setModalOpen(false);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save transaction.");
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
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  return (
    <RoleLayout
      links={financeLinks}
      roleLabel="CFO Portal"
      accent={FINANCE_ACCENT}
      title="Transactions"
      subtitle="Record income and expenses. Approved items move cash; pending expenses wait for review."
      actions={
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: FINANCE_ACCENT }}
        >
          <Plus className="h-4 w-4" />
          New transaction
        </button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>
      )}

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
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(1);
            }}
            placeholder="Search description, reference, counterparty"
            className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none"
          />
          <button
            onClick={() => load(1)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Search
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["ALL", "INCOME", "EXPENSE"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setType(item)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={type === item ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT } : undefined}
            >
              {item}
            </button>
          ))}
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={status === item ? { backgroundColor: "#111827", color: "#fff", borderColor: "#111827" } : undefined}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Details</th>
                <th className="pb-2 font-medium">Account</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading transactions…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No transactions in this view.
                  </td>
                </tr>
              ) : (
                rows.map((txn) => (
                  <tr key={txn.id} className="border-b last:border-0">
                    <td className="py-3 text-gray-500">{formatCompactDate(txn.occurredAt)}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{txn.description}</p>
                      <p className="text-xs text-gray-400">
                        {txn.category?.name}
                        {txn.counterparty ? ` · ${txn.counterparty}` : ""}
                        {txn.reference ? ` · ${txn.reference}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {getUserDisplayName(txn.createdBy)}
                      </p>
                    </td>
                    <td className="py-3 text-gray-600">{txn.account?.name || "—"}</td>
                    <td className="py-3">
                      <Badge color={statusBadgeColor(txn.status)}>{txn.status}</Badge>
                    </td>
                    <td className={`py-3 text-right font-semibold ${txn.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}`}>
                      {txn.type === "INCOME" ? "+" : "−"}
                      {formatRwf(txn.amount)}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {canEditStatus(txn.status) && (
                          <button onClick={() => openEdit(txn)} className="rounded-md border px-2 py-1 text-xs font-semibold">
                            Edit
                          </button>
                        )}
                        {txn.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => run(() => financeService.approveTransaction(txn.id), "Approved.")}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = window.prompt("Rejection reason (optional)") || undefined;
                                run(() => financeService.rejectTransaction(txn.id, reason), "Rejected.");
                              }}
                              className="rounded-md border px-2 py-1 text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(txn.status === "PENDING" || txn.status === "APPROVED") && (
                          <button
                            onClick={() => {
                              const reason = window.prompt("Cancellation reason (optional)") || undefined;
                              run(() => financeService.cancelTransaction(txn.id, reason), "Cancelled. History preserved.");
                            }}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
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

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setModalOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit transaction" : "New transaction"}</h2>
                <p className="mt-1 text-sm text-gray-500">Amounts are stored in whole RWF. Records are never permanently deleted.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["EXPENSE", "INCOME"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: item, categoryId: "" }))}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    form.type === item ? "border-[#164E63] bg-[#164E63]/10 text-[#164E63]" : "text-gray-600"
                  }`}
                >
                  {item === "INCOME" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase text-gray-400">
                Amount (RWF)
                <input
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  type="number"
                  min={1}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-400">
                Date
                <input
                  value={form.occurredAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, occurredAt: e.target.value }))}
                  type="date"
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-400">
                Description
                <input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-400">
                Account
                <select
                  value={form.accountId}
                  onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                >
                  <option value="">Select account</option>
                  {accounts.filter((a) => a.isActive !== false).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
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
              <label className="text-xs font-semibold uppercase text-gray-400">
                Counterparty
                <input
                  value={form.counterparty}
                  onChange={(e) => setForm((prev) => ({ ...prev, counterparty: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-400">
                Reference
                <input
                  value={form.reference}
                  onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs font-semibold uppercase text-gray-400">
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-800"
                />
              </label>
              {!editing && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.postNow}
                    onChange={(e) => setForm((prev) => ({ ...prev, postNow: e.target.checked }))}
                  />
                  Post immediately (approved). Expenses default to pending unless checked.
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Close
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: FINANCE_ACCENT }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default FinanceTransactions;
