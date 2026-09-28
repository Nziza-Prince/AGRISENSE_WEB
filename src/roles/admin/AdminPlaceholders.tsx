import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  adminService,
  ApiError,
  type AdminAuditLog,
  type AdminOverviewStatistics,
  type AdminUserRole,
  type AdminUserSummary,
  type CreateOrgAccountDto,
} from "@/api";
import { getUserDisplayName } from "@/lib/user";

function getRows<T>(data: unknown, keys: string[]): T[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

const emptyOrgForm = (): CreateOrgAccountDto => ({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  businessName: "",
  organizationName: "",
  autoApprove: true,
});

function CreateOrgForm({
  kind,
  onCreated,
}: {
  kind: "supplier" | "ngo";
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(emptyOrgForm);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      const dto: CreateOrgAccountDto = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        autoApprove: form.autoApprove,
        ...(kind === "supplier"
          ? { businessName: form.businessName?.trim() || undefined }
          : { organizationName: form.organizationName?.trim() || undefined }),
      };
      if (kind === "supplier") await adminService.createSupplier(dto);
      else await adminService.createNgo(dto);
      setInfo(`${kind === "supplier" ? "Supplier" : "NGO"} created.`);
      setForm(emptyOrgForm());
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title={kind === "supplier" ? "Create supplier" : "Create NGO"}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          placeholder="First name"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          placeholder="Last name"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
        />
        <input
          value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
          placeholder="Phone (optional)"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Temporary password"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        {kind === "supplier" ? (
          <input
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            placeholder="Business name (optional)"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
          />
        ) : (
          <input
            value={form.organizationName}
            onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
            placeholder="Organization name (optional)"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
          />
        )}
        <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={!!form.autoApprove}
            onChange={(e) => setForm((f) => ({ ...f, autoApprove: e.target.checked }))}
          />
          Auto-approve on create
        </label>
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-lg bg-[#4338CA] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Creating…" : `Create ${kind === "supplier" ? "supplier" : "NGO"}`}
        </button>
      </form>
    </Panel>
  );
}

export const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<AdminUserSummary[]>([]);
  const [ngos, setNgos] = useState<AdminUserSummary[]>([]);
  const [pendingSuppliers, setPendingSuppliers] = useState<AdminUserSummary[]>([]);
  const [pendingNgos, setPendingNgos] = useState<AdminUserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppliersRes, ngosRes, pendingSupRes, pendingNgoRes] = await Promise.all([
        adminService.getSuppliers({ page: 1, limit: 50 }).catch(() => ({})),
        adminService.getNgos({ page: 1, limit: 50 }).catch(() => ({})),
        adminService.getPendingSuppliers(),
        adminService.getPendingNgos(),
      ]);
      setSuppliers(getRows<AdminUserSummary>(suppliersRes, ["suppliers", "items", "data"]));
      setNgos(getRows<AdminUserSummary>(ngosRes, ["ngos", "items", "data"]));
      setPendingSuppliers(getRows<AdminUserSummary>(pendingSupRes, ["suppliers", "items", "data"]));
      setPendingNgos(getRows<AdminUserSummary>(pendingNgoRes, ["ngos", "items", "data"]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Suppliers | Admin | AGRISENSE";
    load();
  }, []);

  const section = (
    title: string,
    rows: AdminUserSummary[],
    approve?: (id: string) => Promise<unknown>,
    reject?: (id: string) => Promise<unknown>,
  ) => (
    <Panel title={title}>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500">No records.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{getUserDisplayName(row)}</p>
                <p className="text-sm text-gray-500">{row.email || row.phoneNumber || "—"}</p>
                {row.status && (
                  <p className="mt-1 text-xs text-gray-400">Status: {String(row.status)}</p>
                )}
              </div>
              {approve && reject ? (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await approve(row.id);
                      await load();
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      await reject(row.id);
                      await load();
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );

  return (
    <RoleLayout links={adminLinks} roleLabel="Admin Console" accent={ADMIN_ACCENT} title="Organizations">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#4338CA]" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CreateOrgForm kind="supplier" onCreated={load} />
            <CreateOrgForm kind="ngo" onCreated={load} />
          </div>
          {section(
            "Pending suppliers",
            pendingSuppliers,
            adminService.approveSupplier,
            (id) => adminService.rejectSupplier(id, {}),
          )}
          {section(
            "Pending NGOs",
            pendingNgos,
            adminService.approveNgo,
            (id) => adminService.rejectNgo(id, {}),
          )}
          {section("All suppliers", suppliers)}
          {section("All NGOs", ngos)}
        </div>
      )}
    </RoleLayout>
  );
};

export const AdminAnalytics = () => {
  const [overview, setOverview] = useState<AdminOverviewStatistics | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [farmStats, setFarmStats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    document.title = "Analytics | Admin | AGRISENSE";
    (async () => {
      const [overviewRes, usersRes, logsRes, farmsRes] = await Promise.all([
        adminService.getOverviewStatistics().catch(() => null),
        adminService.getUsers({ page: 1, limit: 100 }),
        adminService.getAuditLogs(1, 20),
        adminService.getFarmStatistics(),
      ]);
      setOverview(overviewRes);
      setUsers(getRows<AdminUserSummary>(usersRes, ["users", "items", "data"]));
      setLogs(getRows<AdminAuditLog>(logsRes, ["logs", "items", "data"]));
      setFarmStats(farmsRes);
    })().catch(() => undefined);
  }, []);

  const statusCounts = useMemo(
    () =>
      users.reduce<Record<string, number>>((acc, user) => {
        const key = user.status || "UNKNOWN";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [users],
  );

  const overviewCards = [
    { label: "Total users", value: overview?.totalUsers },
    { label: "Active users", value: overview?.activeUsers },
    { label: "Suspended", value: overview?.suspendedUsers },
    { label: "Banned", value: overview?.bannedUsers },
    { label: "Farms", value: overview?.totalFarms ?? farmStats.totalFarms },
    { label: "Pending suppliers", value: overview?.pendingSuppliers },
    { label: "Pending NGOs", value: overview?.pendingNgos },
    { label: "Waitlist", value: overview?.waitlistTotal },
    { label: "Reported posts", value: overview?.reportedPosts },
  ].filter((card) => card.value !== undefined && card.value !== null);

  return (
    <RoleLayout links={adminLinks} roleLabel="Admin Console" accent={ADMIN_ACCENT} title="Analytics">
      <div className="grid gap-6 lg:grid-cols-2">
        {overviewCards.length > 0 && (
          <Panel title="Overview statistics" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{String(card.value)}</p>
                </div>
              ))}
            </div>
          </Panel>
        )}
        <Panel title="Platform status overview">
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm text-gray-700">{key}</span>
                <Badge color="purple">{value}</Badge>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Farm statistics">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Total farms: {String(farmStats.totalFarms ?? 0)}</p>
            <p>Active farms: {String(farmStats.activeFarms ?? 0)}</p>
            <p>Archived farms: {String(farmStats.archivedFarms ?? 0)}</p>
            <p>Average size: {String(farmStats.averageFarmSize ?? 0)}</p>
          </div>
        </Panel>
        <Panel title="Recent audit activity" className="lg:col-span-2">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-semibold text-gray-900">{log.action || "ACTION"}</span>
                <span className="ml-2 text-gray-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </RoleLayout>
  );
};

const ANNOUNCEMENT_ROLES: Array<{ value: "" | AdminUserRole; label: string }> = [
  { value: "", label: "Everyone" },
  { value: "FARMER", label: "Farmers" },
  { value: "SUPPLIER", label: "Suppliers" },
  { value: "NGO", label: "NGOs" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "CFO", label: "CFO" },
];

export const AdminSettings = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState<"" | AdminUserRole>("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);

  const loadLogs = async () => {
    try {
      const res = await adminService.getAuditLogs(1, 20);
      setLogs(getRows<AdminAuditLog>(res, ["logs", "items", "data"]));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.title = "Settings | Admin | AGRISENSE";
    loadLogs();
  }, []);

  return (
    <RoleLayout links={adminLinks} roleLabel="Admin Console" accent={ADMIN_ACCENT} title="Settings">
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {info}
          </div>
        )}
        <Panel title="Broadcast announcement">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-11 w-full rounded-lg border border-gray-200 px-3"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement message"
              rows={4}
              className="w-full rounded-lg border border-gray-200 p-3"
            />
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as "" | AdminUserRole)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            >
              {ANNOUNCEMENT_ROLES.map((role) => (
                <option key={role.label} value={role.value}>
                  Audience: {role.label}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                try {
                  setError(null);
                  await adminService.broadcastAnnouncement({
                    title,
                    message,
                    ...(targetRole ? { targetRole } : {}),
                  });
                  setInfo(
                    targetRole
                      ? `Announcement sent to ${targetRole}.`
                      : "Announcement sent to everyone.",
                  );
                  setTitle("");
                  setMessage("");
                  setTargetRole("");
                  await loadLogs();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Failed to send announcement.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white"
            >
              <Send className="h-4 w-4" />
              Broadcast
            </button>
          </div>
        </Panel>
        <Panel title="Audit logs">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <p className="font-semibold text-gray-900">{log.action || "ACTION"}</p>
                <p className="text-gray-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))}
            {!logs.length && <p className="text-sm text-gray-500">No audit logs available.</p>}
          </div>
        </Panel>
      </div>
    </RoleLayout>
  );
};
