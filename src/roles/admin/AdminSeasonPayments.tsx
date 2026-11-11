import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, PaginationControls, Panel, getPaginationMeta } from "../ui";
import { PaymentFlow, RevenueTimeline } from "./PaymentFlow";
import { EmptyState } from "@/components/EmptyState";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  ApiError,
  billingService,
  type AdminSeasonPass,
  type SeasonPassList,
  type SeasonPassStatus,
} from "@/api";

const PAGE_SIZE = 15;

type StatusFilter = "" | SeasonPassStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "submitted", label: "To confirm" },
  { value: "awaiting_payment", label: "Not paid yet" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

const STATUS_LABEL: Record<SeasonPassStatus, string> = {
  awaiting_payment: "Not paid yet",
  submitted: "To confirm",
  paid: "Paid",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<
  SeasonPassStatus,
  "green" | "amber" | "red" | "gray"
> = {
  awaiting_payment: "gray",
  submitted: "amber",
  paid: "green",
  rejected: "red",
};

const rwf = (amount: number) => `${amount.toLocaleString("en-US")} RWF`;

const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

type Dialog =
  | { kind: "paid"; pass: AdminSeasonPass }
  | { kind: "reject"; pass: AdminSeasonPass }
  | null;

/** Admin screen: payments farmers say they made by mobile money, waiting to be checked and confirmed. */
const AdminSeasonPayments = () => {
  const [data, setData] = useState<SeasonPassList | null>(null);
  const [everyPass, setEveryPass] = useState<AdminSeasonPass[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("submitted");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingService.adminListSeasonPasses({
        status: filter || undefined,
        search: query || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(res);
      billingService
        .adminListSeasonPasses({ status: "paid", page: 1, limit: 100 })
        .then((all) => setEveryPass(all.items))
        .catch(() => undefined);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load payments.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filter, query, page]);

  useEffect(() => {
    document.title = "Payments | Admin | AGRISENSE";
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary ?? {};
  const toConfirm = summary.submitted?.count ?? 0;
  const paidCount = summary.paid?.count ?? 0;
  const paidTotal = summary.paid?.amount ?? 0;
  const meta = getPaginationMeta(
    data,
    page,
    PAGE_SIZE,
    data?.items.length ?? 0,
  );

  const openDialog = (next: Dialog) => {
    setDialog(next);
    setText("");
    setDialogError(null);
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    setSaving(true);
    setDialogError(null);
    try {
      if (dialog.kind === "paid") {
        await billingService.adminMarkSeasonPassPaid(
          dialog.pass.id,
          text.trim() || undefined,
        );
        setNotice(
          `Marked as paid. ${dialog.pass.farmer?.name || "The farmer"} has been notified.`,
        );
      } else {
        await billingService.adminRejectSeasonPass(dialog.pass.id, text.trim());
        setNotice("Rejected. The farmer has been told why and can try again.");
      }
      setDialog(null);
      await load();
    } catch (err) {
      setDialogError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleLayout
      title="Season payments"
      subtitle="Confirm mobile money payments so farmers can keep getting recommendations"
      links={adminLinks}
      accent={ADMIN_ACCENT}
      roleLabel="Admin"
    >
      <div className="space-y-6">
        <PaymentFlow
          summary={summary}
          active={filter}
          onPick={(status) => {
            setFilter(status);
            setPage(1);
          }}
        />

        <Panel title="Confirmed revenue by month">
          <RevenueTimeline passes={everyPass} />
          <p className="mt-3 text-xs text-gray-500">
            {paidCount} paid pass{paidCount === 1 ? "" : "es"} · {rwf(paidTotal)} confirmed in total.
          </p>
        </Panel>

        {notice && (
          <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>{notice}</span>
            <button
              type="button"
              className="ml-4 font-medium underline"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Panel
          title="Payments"
          action={
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  filter === f.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
                {f.value === "submitted" && toConfirm > 0
                  ? ` (${toConfirm})`
                  : ""}
              </button>
            ))}
            <form
              className="ml-auto flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQuery(search.trim());
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code, transaction ID, farmer or farm"
                  className="w-72 rounded-lg border py-2 pl-9 pr-3 text-sm"
                  aria-label="Search payments"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading payments
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              art="coins"
              title={filter === "submitted" ? "Nothing to confirm" : "No payments here"}
              text={filter === "submitted" ? "When a farmer says they have paid, it shows up here for you to check." : "No payments match this view."}
            />
          ) : (
            <div>
              <ul className="space-y-3">
                {data.items.map((pass) => (
                  <li key={pass.id} className="rounded-xl border border-l-4 p-4" style={{ borderLeftColor: pass.status === "paid" ? "#059669" : pass.status === "rejected" ? "#DC2626" : pass.status === "submitted" ? "#D97706" : "#94A3B8" }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {pass.farmer?.name || pass.farmer?.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pass.farmer?.email}
                          {pass.farmer?.phone ? ` · ${pass.farmer.phone}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          Farm:{" "}
                          <span className="font-medium">{pass.farmName}</span> ·{" "}
                          {pass.seasonLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {rwf(pass.amount)}
                        </p>
                        <Badge color={STATUS_COLOR[pass.status]}>
                          {STATUS_LABEL[pass.status]}
                        </Badge>
                      </div>
                    </div>

                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Payment code
                        </dt>
                        <dd className="font-mono text-gray-900">
                          {pass.reference}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Transaction ID
                        </dt>
                        <dd className="break-all font-mono text-gray-900">
                          {pass.momoTransactionId || "not given yet"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">
                          Sent
                        </dt>
                        <dd className="text-gray-900">
                          {when(pass.submittedAt)}
                          {pass.payerPhone ? ` · from ${pass.payerPhone}` : ""}
                        </dd>
                      </div>
                    </dl>

                    {pass.adminNote && (
                      <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        Note: {pass.adminNote}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {pass.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => openDialog({ kind: "reject", pass })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />{" "}
                          {pass.status === "paid" ? "Undo payment" : "Reject"}
                        </button>
                      )}
                      {pass.status !== "paid" && (
                        <button
                          type="button"
                          onClick={() => openDialog({ kind: "paid", pass })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Mark as paid
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <PaginationControls
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </Panel>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {dialog.kind === "paid"
                ? "Confirm this payment?"
                : dialog.pass.status === "paid"
                  ? "Undo this payment?"
                  : "Reject this payment?"}
            </h2>
            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              <p>
                <span className="font-semibold">
                  {dialog.pass.farmer?.name || dialog.pass.farmer?.email}
                </span>{" "}
                for {dialog.pass.farmName}
              </p>
              <p>
                {rwf(dialog.pass.amount)} · code{" "}
                <span className="font-mono">{dialog.pass.reference}</span>
              </p>
              <p>
                Transaction ID:{" "}
                <span className="font-mono">
                  {dialog.pass.momoTransactionId || "none given"}
                </span>
              </p>
            </div>
            {dialog.kind === "paid" ? (
              <>
                <p className="mt-3 text-sm text-gray-600">
                  Only confirm after you have seen the money arrive. The farmer
                  will be notified and the farm unlocked until the end of the
                  season.
                </p>
                <label className="mt-3 block text-sm font-medium text-gray-700">
                  Note{" "}
                  {dialog.pass.momoTransactionId
                    ? "(optional)"
                    : "(required: how was it paid?)"}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="For example: checked on the MoMo statement"
                  />
                </label>
              </>
            ) : (
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Reason the farmer will see (required)
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="For example: amount received was too low"
                />
              </label>
            )}
            {dialogError && (
              <p className="mt-3 text-sm text-red-600">{dialogError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={saving}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog}
                disabled={
                  saving || (dialog.kind === "reject" && text.trim().length < 5)
                }
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  dialog.kind === "paid"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {dialog.kind === "paid" ? "Yes, mark as paid" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default AdminSeasonPayments;
