import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, PaginationControls, Panel } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type AdminAuditLog } from "@/api";
import { EmptyState } from "@/components/EmptyState";

const PAGE_SIZE = 25;

const GROUPS: Array<{ label: string; actions: string[] }> = [
  { label: "All", actions: [] },
  { label: "Sign-in", actions: ["LOGIN", "LOGIN_FAILED", "LOGOUT", "TOKEN_REFRESH"] },
  { label: "Accounts", actions: ["REGISTER", "EMAIL_VERIFY", "PASSWORD_RESET", "PASSWORD_CHANGE"] },
  { label: "Admin actions", actions: ["USER_SUSPENDED", "USER_REACTIVATED", "USER_DELETED", "USER_RESTORED", "SUPPLIER_APPROVED", "SUPPLIER_REJECTED", "NGO_APPROVED", "NGO_REJECTED"] },
  { label: "Billing", actions: ["SUBSCRIPTION_ASSIGNED", "SUBSCRIPTION_REVOKED", "SEASON_PASS_PAID", "SEASON_PASS_REJECTED"] },
];

const actionColor = (action?: string): "green" | "amber" | "red" | "blue" | "gray" | "purple" => {
  const a = action || "";
  if (a === "LOGIN_FAILED" || a.endsWith("REJECTED") || a === "USER_DELETED" || a === "SUBSCRIPTION_REVOKED") return "red";
  if (a === "USER_SUSPENDED") return "amber";
  if (a.endsWith("APPROVED") || a === "USER_REACTIVATED" || a === "USER_RESTORED" || a === "SEASON_PASS_PAID") return "green";
  if (a.startsWith("PASSWORD")) return "purple";
  if (a === "LOGIN" || a === "LOGOUT" || a === "TOKEN_REFRESH") return "gray";
  return "blue";
};

const label = (action?: string) =>
  (action || "ACTION").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const AdminAudit = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Audit logs | Admin | AGRISENSE";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await adminService.getAuditLogs(page, PAGE_SIZE, action || undefined)) as {
        logs?: AdminAuditLog[];
        total?: number;
      };
      setLogs(res.logs ?? []);
      setTotal(res.total ?? res.logs?.length ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const rows = q
    ? logs.filter((l) =>
        [l.email, l.ipAddress, l.action, JSON.stringify(l.metadata ?? {})]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : logs;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Audit logs"
      subtitle="A permanent record of who did what and when: sign-ins, account changes, approvals and payments. Entries cannot be edited or deleted."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by action"
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="">All actions</option>
            {GROUPS.filter((g) => g.actions.length).map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.actions.map((a) => (
                  <option key={a} value={a}>
                    {label(a)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this page by email, IP or details"
            className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <span className="text-xs text-gray-500">{total.toLocaleString()} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Account</th>
                <th className="pb-2 font-medium">IP address</th>
                <th className="pb-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState art="search" title="No entries match" compact />
                  </td>
                </tr>
              ) : (
                rows.map((log) => (
                  <tr key={log.id} className="border-b align-top last:border-0">
                    <td className="whitespace-nowrap py-3 text-gray-600">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3">
                      <Badge color={actionColor(log.action)}>{label(log.action)}</Badge>
                    </td>
                    <td className="py-3 text-gray-800">{(log.email as string | undefined) || "—"}</td>
                    <td className="py-3 text-gray-500">{(log.ipAddress as string | undefined) || "—"}</td>
                    <td className="max-w-xs break-words py-3 font-mono text-xs text-gray-500">
                      {log.metadata && Object.keys(log.metadata).length ? JSON.stringify(log.metadata) : "—"}
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
          onPageChange={setPage}
          disabled={loading}
        />
      </Panel>
    </RoleLayout>
  );
};

export default AdminAudit;
