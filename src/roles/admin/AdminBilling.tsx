import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "react-countup";
import { CreditCard, Loader2, RefreshCw, UserCog, X } from "lucide-react";
import TagSearch, { type TagGroup } from "./orgs/TagSearch";
import RoleLayout from "../RoleLayout";
import { Badge, Panel, PaginationControls, getPaginationMeta } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  ApiError,
  adminService,
  billingService,
  type AdminUserSummary,
  type AdminAssignSubscriptionDto,
  type BillingCycle,
  type BillingPlanId,
} from "@/api";

const PAGE_SIZE = 20;

type Tab = "subscriptions" | "transactions";

interface BillingUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface BillingRow {
  id?: string;
  userId?: string;
  email?: string;
  userEmail?: string;
  userName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  planId?: string;
  status?: string;
  billingCycle?: string;
  paymentMethod?: string;
  paymentLabel?: string;
  amount?: number;
  currency?: string;
  method?: string;
  providerRef?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Nested user from admin billing API */
  user?: BillingUser | null;
  [key: string]: unknown;
}

function unwrapRows(data: unknown, keys: string[]): BillingRow[] {
  if (Array.isArray(data)) return data as BillingRow[];
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as BillingRow[];
  }
  return [];
}

function nestedUser(row: BillingRow): BillingUser | null {
  if (row.user && typeof row.user === "object") return row.user;
  return null;
}

function rowUserId(row: BillingRow): string | undefined {
  const nested = nestedUser(row);
  const id = nested?.id || row.userId;
  return id ? String(id) : undefined;
}

function displayUser(row: BillingRow) {
  const nested = nestedUser(row);
  const fullName = [nested?.firstName || row.firstName, nested?.lastName || row.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const userId = rowUserId(row);
  return (
    fullName ||
    nested?.name ||
    row.userName ||
    row.name ||
    nested?.email ||
    row.userEmail ||
    row.email ||
    (userId ? `User ${userId.slice(0, 8)}…` : "—")
  );
}

function displayEmail(row: BillingRow) {
  const nested = nestedUser(row);
  return nested?.email || row.userEmail || row.email || "—";
}

function formatMoney(amount?: number, currency = "RWF") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return `${currency} ${amount.toLocaleString()}`;
}

function statusColor(status?: string): "green" | "amber" | "red" | "blue" | "gray" | "purple" {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "successful" || s === "success") return "green";
  if (s === "pending_payment" || s === "pending" || s === "initiated" || s === "trialing") {
    return "amber";
  }
  if (s === "failed" || s === "expired" || s === "canceled" || s === "past_due" || s === "banned") {
    return "red";
  }
  if (s === "pro" || s === "enterprise") return "purple";
  return "gray";
}

const AdminBilling = () => {
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [assignUserId, setAssignUserId] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [pickQuery, setPickQuery] = useState("");
  const [pickHits, setPickHits] = useState<AdminUserSummary[]>([]);
  const [picked, setPicked] = useState<AdminUserSummary | null>(null);
  const [assignPlan, setAssignPlan] = useState<BillingPlanId>("pro");
  const [assignCycle, setAssignCycle] = useState<BillingCycle>("monthly");
  const [assignDays, setAssignDays] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (nextPage = page, nextTab = tab) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = {
        page: nextPage,
        limit: PAGE_SIZE,
      };
      if (planFilter) params.planId = planFilter;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res =
        nextTab === "subscriptions"
          ? await billingService.adminListSubscriptions(params)
          : await billingService.adminListTransactions(params);

      const list = unwrapRows(
        res,
        nextTab === "subscriptions"
          ? ["subscriptions", "items", "data", "rows"]
          : ["transactions", "items", "data", "rows"],
      );
      const meta = getPaginationMeta(res, nextPage, PAGE_SIZE, list.length);
      setRows(list);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load billing data.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Billing | Admin | AGRISENSE";
    load(1, "subscriptions");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(1, tab), search ? 300 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFilter, statusFilter, search]);

  useEffect(() => {
    const term = pickQuery.trim();
    if (term.length < 2) {
      setPickHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      adminService
        .getUsers({ page: 1, limit: 6, search: term })
        .then((res) => setPickHits(((res as { users?: AdminUserSummary[]; items?: AdminUserSummary[] }).users ?? (res as { items?: AdminUserSummary[] }).items ?? [])))
        .catch(() => setPickHits([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pickQuery]);

  const summary = useMemo(() => {
    const byPlan: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    rows.forEach((row) => {
      const plan = String(row.planId || "unknown");
      const status = String(row.status || "unknown");
      byPlan[plan] = (byPlan[plan] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    return { byPlan, byStatus };
  }, [rows]);

  const filterGroups: TagGroup[] = [
    { key: "plan", label: "plan", options: ["starter", "pro", "enterprise"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1), count: summary.byPlan[v] ?? 0 })) },
    {
      key: "status",
      label: "status",
      options: ["active", "pending_payment", "canceled", "expired", "successful", "failed"].map((v) => ({ value: v, label: v.replace("_", " ").replace(/^./, (c) => c.toUpperCase()), count: summary.byStatus[v] ?? 0 })),
    },
  ];


  const switchTab = (next: Tab) => {
    setTab(next);
    setPage(1);
    load(1, next);
  };

  const runAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId.trim()) {
      setError("Enter a user ID to assign a plan.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const dto: AdminAssignSubscriptionDto = {
        planId: assignPlan,
        note: assignNote.trim() || undefined,
      };
      if (assignPlan === "pro") dto.billingCycle = assignCycle;
      if (assignDays.trim()) dto.periodDays = Number(assignDays);
      await billingService.adminAssign(assignUserId.trim(), dto);
      setInfo(`Assigned ${assignPlan} to user ${assignUserId.trim()}.`);
      setAssignNote("");
      await load(page, tab);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign subscription.");
    } finally {
      setSaving(false);
    }
  };

  const runRevoke = async (userId?: string) => {
    if (!userId) return;
    if (!confirm("Revoke this subscription and return the user to Starter?")) return;
    setError(null);
    setInfo(null);
    try {
      await billingService.adminRevoke(userId, { note: "Revoked by admin" });
      setInfo("Subscription revoked. User is on Starter.");
      await load(page, tab);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke subscription.");
    }
  };

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Billing"
      subtitle="Subscriptions, payments, and manual plan grants."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {info}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {([{ id: "subscriptions" as const, label: "Subscriptions" }, { id: "transactions" as const, label: "Transactions" }]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === item.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => load(page, tab)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={() => setGrantOpen((o) => !o)} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white" style={{ backgroundColor: ADMIN_ACCENT }}>
            <UserCog className="h-4 w-4" /> Grant a plan
          </button>
        </div>
      </div>

      <AnimatePresence>
        {grantOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Panel
              title="Grant a plan"
              action={
                <button type="button" onClick={() => setGrantOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              }
            >
              <form onSubmit={runAssign} className="grid gap-3 lg:grid-cols-2">
                <div className="relative">
                  <input
                    value={picked ? `${picked.firstName ?? ""} ${picked.lastName ?? ""} · ${picked.email ?? ""}` : pickQuery}
                    onChange={(e) => {
                      setPicked(null);
                      setAssignUserId("");
                      setPickQuery(e.target.value);
                    }}
                    placeholder="Find the person by name or email"
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#4338CA]"
                  />
                  {!picked && pickHits.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
                      {pickHits.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => {
                              setPicked(u);
                              setAssignUserId(u.id);
                              setPickHits([]);
                            }}
                          >
                            <span className="font-medium text-gray-900">{`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}</span>
                            <span className="text-xs text-gray-500">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={assignPlan} onChange={(e) => setAssignPlan(e.target.value as BillingPlanId)} className="h-10 rounded-lg border border-gray-200 px-2 text-sm">
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <select value={assignCycle} onChange={(e) => setAssignCycle(e.target.value as BillingCycle)} disabled={assignPlan !== "pro"} className="h-10 rounded-lg border border-gray-200 px-2 text-sm disabled:opacity-50">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                  <input value={assignDays} onChange={(e) => setAssignDays(e.target.value.replace(/\D/g, ""))} placeholder="Days (optional)" className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#4338CA]" />
                </div>
                <input value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="Note (optional)" className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#4338CA]" />
                <button type="submit" disabled={saving || !assignUserId} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: ADMIN_ACCENT }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />} Assign plan
                </button>
              </form>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        {[
          { label: "Total", value: total || rows.length, color: "#4338CA" },
          { label: "Active or successful", value: (summary.byStatus.active || 0) + (summary.byStatus.successful || 0) + (summary.byStatus.success || 0), color: "#10B981" },
          { label: "Pending", value: (summary.byStatus.pending_payment || 0) + (summary.byStatus.pending || 0), color: "#F59E0B" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-2xl border bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">{k.label}</span>
            <span className="mt-1 block text-3xl font-bold" style={{ color: k.color }}>
              <CountUp end={k.value} duration={1} />
            </span>
          </motion.div>
        ))}
        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <span className="text-xs font-medium text-gray-500">Plan mix on this page</span>
          <div className="mt-3 flex h-6 overflow-hidden rounded-full bg-gray-100">
            {Object.entries(summary.byPlan).map(([plan, n], i) => (
              <motion.div
                key={plan}
                title={`${plan}: ${n}`}
                className="h-full"
                style={{ background: ["#94A3B8", "#4338CA", "#B45309", "#0F766E"][i % 4] }}
                initial={{ width: 0 }}
                animate={{ width: `${(n / Math.max(rows.length, 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-gray-500">
            {Object.entries(summary.byPlan).map(([plan, n], i) => (
              <span key={plan} className="flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: ["#94A3B8", "#4338CA", "#B45309", "#0F766E"][i % 4] }} />
                {plan} {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TagSearch
          query={search}
          onQuery={setSearch}
          groups={filterGroups}
          selected={{ plan: planFilter || null, status: statusFilter || null }}
          onSelect={(group, value) => (group === "plan" ? setPlanFilter(value ?? "") : setStatusFilter(value ?? ""))}
          placeholder="Search by email, or filter by plan and status…"
        />
      </div>

      <Panel
        title={tab === "subscriptions" ? `Subscriptions (${total || rows.length})` : `Transactions (${total || rows.length})`}
        action={<CreditCard className="h-4 w-4 text-gray-400" />}
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#4338CA]" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No {tab} found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-400">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Email</th>
                    {tab === "subscriptions" ? (
                      <>
                        <th className="pb-2 font-medium">Plan</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Cycle</th>
                        <th className="pb-2 font-medium">Period end</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Method</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Provider ref</th>
                        <th className="pb-2 font-medium">Created</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const userId = rowUserId(row);
                    return (
                    <tr key={row.id || `${userId || "row"}-${index}`} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-800">{displayUser(row)}</td>
                      <td className="py-3 text-gray-500">{displayEmail(row)}</td>
                      {tab === "subscriptions" ? (
                        <>
                          <td className="py-3">
                            <Badge color={statusColor(row.planId)}>{row.planId || "—"}</Badge>
                          </td>
                          <td className="py-3">
                            <Badge color={statusColor(row.status)}>
                              {(row.status || "—").replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 capitalize text-gray-600">
                            {row.billingCycle || "—"}
                            {row.cancelAtPeriodEnd ? " · ending" : ""}
                          </td>
                          <td className="py-3 text-gray-500">
                            {row.currentPeriodEnd
                              ? new Date(row.currentPeriodEnd).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3">
                            {userId && String(row.planId || "").toLowerCase() !== "starter" ? (
                              <button
                                type="button"
                                onClick={() => runRevoke(userId)}
                                className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 font-medium text-gray-800">
                            {formatMoney(row.amount, row.currency || "RWF")}
                          </td>
                          <td className="py-3 capitalize text-gray-600">
                            {row.method || row.paymentMethod || "—"}
                          </td>
                          <td className="py-3">
                            <Badge color={statusColor(row.status)}>
                              {(row.status || "—").replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 font-mono text-xs text-gray-500">
                            {row.providerRef || "—"}
                          </td>
                          <td className="py-3 text-gray-500">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              limit={PAGE_SIZE}
              onPageChange={(next) => load(next, tab)}
            />
          </>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default AdminBilling;
