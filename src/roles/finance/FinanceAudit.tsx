import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, PaginationControls, Panel } from "../ui";
import { FINANCE_ACCENT, financeLinks } from "./config";
import { formatDateTime, formatRwf } from "./format";
import { ApiError, financeService, type FinanceAuditLog } from "@/api";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

const actionColor = (action?: string): "green" | "amber" | "red" | "blue" | "gray" => {
  switch ((action || "").toUpperCase()) {
    case "CREATED":
      return "blue";
    case "UPDATED":
      return "amber";
    case "APPROVED":
      return "green";
    case "REJECTED":
    case "CANCELLED":
      return "red";
    default:
      return "gray";
  }
};

const FinanceAudit = () => {
  const [logs, setLogs] = useState<FinanceAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Audit | Finance | AGRISENSE";
  }, []);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeService.listAudit({
        page: nextPage,
        limit: PAGE_SIZE,
        action: action === "ALL" ? undefined : action,
      });
      setLogs(res.logs || []);
      setPage(res.page || nextPage);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  return (
    <RoleLayout
      links={financeLinks}
      roleLabel="CFO Portal"
      accent={FINANCE_ACCENT}
      title="Audit trail"
      subtitle="Every create, update, approval, rejection, and cancellation is retained."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          {["ALL", "CREATED", "UPDATED", "APPROVED", "REJECTED", "CANCELLED"].map((item) => (
            <button
              key={item}
              onClick={() => setAction(item)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={
                action === item
                  ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT }
                  : undefined
              }
            >
              {item}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Entity</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading audit log…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No audit events yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-3 whitespace-nowrap text-gray-500">{formatDateTime(log.createdAt)}</td>
                    <td className="py-3">
                      <Badge color={actionColor(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{log.entityType}</p>
                      <p className="font-mono text-[11px] text-gray-400">{log.entityId}</p>
                    </td>
                    <td className="py-3 text-gray-600">{getUserDisplayName(log.user)}</td>
                    <td className="py-3 text-xs text-gray-500">
                      {log.metadata?.amount != null ? formatRwf(Number(log.metadata.amount)) : ""}
                      {log.metadata?.name ? ` ${String(log.metadata.name)}` : ""}
                      {log.metadata?.reason ? ` · ${String(log.metadata.reason)}` : ""}
                      {log.metadata?.status ? ` · ${String(log.metadata.status)}` : ""}
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
    </RoleLayout>
  );
};

export default FinanceAudit;
