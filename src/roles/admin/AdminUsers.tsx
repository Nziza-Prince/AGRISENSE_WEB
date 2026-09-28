import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge, PaginationControls, getPaginationMeta } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type AdminUserRole, type AdminUserSummary } from "@/api";
import { useAuth } from "@/context/useAuth";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

const roleColor: Record<string, "green" | "amber" | "red" | "blue" | "gray" | "purple"> = {
  FARMER: "green",
  SUPPLIER: "blue",
  NGO: "purple",
  GOVERNMENT: "amber",
  ADMIN: "gray",
  CFO: "blue",
  Farmer: "green",
  Supplier: "blue",
  Admin: "gray",
};

const statusColor: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green",
  PENDING: "amber",
  SUSPENDED: "amber",
  BANNED: "red",
  DELETED: "gray",
  active: "green",
  pending: "amber",
  suspended: "amber",
  banned: "red",
  deleted: "gray",
};

const ROLES = ["ALL", "FARMER", "SUPPLIER", "NGO", "GOVERNMENT", "CFO", "ADMIN"] as const;
const STATUSES = ["ALL", "ACTIVE", "PENDING", "SUSPENDED", "BANNED", "DELETED"] as const;
const ASSIGNABLE_ROLES: AdminUserRole[] = ["FARMER", "SUPPLIER", "NGO", "GOVERNMENT", "CFO", "ADMIN"];

function accountStatusLabel(user: AdminUserSummary) {
  if (user.deletedAt) return "DELETED";
  return String(user.status || "UNKNOWN").toUpperCase();
}

function getUsers(data: unknown): AdminUserSummary[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.users ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as AdminUserSummary[]) : [];
}

function isProtectedTarget(actorId: string | undefined, target: AdminUserSummary) {
  if (actorId && target.id === actorId) return true;
  return String(target.role || "").toUpperCase() === "ADMIN";
}

function formatRoleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const AdminUsers = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<(typeof ROLES)[number]>("ALL");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [roleModalUser, setRoleModalUser] = useState<AdminUserSummary | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>("FARMER");
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    document.title = "Users | Admin | AGRISENSE";
  }, []);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        page: nextPage,
        limit: PAGE_SIZE,
        role: role === "ALL" ? undefined : (role as AdminUserRole),
        status: status === "ALL" || status === "DELETED" ? undefined : status,
        search: query.trim() || undefined,
        includeDeleted: status === "DELETED",
      });
      const rows = getUsers(res);
      const meta = getPaginationMeta(res, nextPage, PAGE_SIZE, rows.length);
      setUsers(rows);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  const rows = useMemo(() => users, [users]);

  const openRoleModal = (target: AdminUserSummary) => {
    setError(null);
    setInfo(null);
    if (isProtectedTarget(user?.id, target)) {
      setError("You cannot modify your own account or another admin.");
      return;
    }
    const current = String(target.role || "FARMER").toUpperCase() as AdminUserRole;
    setSelectedRole(ASSIGNABLE_ROLES.includes(current) ? current : "FARMER");
    setRoleModalUser(target);
  };

  const closeRoleModal = () => {
    if (roleSaving) return;
    setRoleModalUser(null);
  };

  const confirmRoleChange = async () => {
    if (!roleModalUser) return;
    if (String(roleModalUser.role || "").toUpperCase() === selectedRole) {
      setInfo("That user already has this role.");
      setRoleModalUser(null);
      return;
    }
    setRoleSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminService.updateUserRole(roleModalUser.id, selectedRole);
      setInfo(
        `Role updated: ${getUserDisplayName(roleModalUser)} is now ${formatRoleLabel(selectedRole)}.`,
      );
      setRoleModalUser(null);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const runAction = async (
    target: AdminUserSummary,
    task: () => Promise<unknown>,
    okMsg?: string,
  ) => {
    setInfo(null);
    if (isProtectedTarget(user?.id, target)) {
      setError("You cannot modify your own account or another admin.");
      return;
    }
    try {
      await task();
      if (okMsg) setInfo(okMsg);
      await load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="User Management"
      subtitle="Suspend pauses login but keeps community posts. Ban hides community presence. Delete removes them from the platform while keeping their email reserved."
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
      <Panel>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                load(1);
              }
            }}
            placeholder="Search by name, email, or phone"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none"
          />
          <button
            onClick={() => {
              setPage(1);
              load(1);
            }}
            className="rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white"
          >
            Search / Refresh
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                role === r
                  ? { backgroundColor: ADMIN_ACCENT, color: "#fff", borderColor: ADMIN_ACCENT }
                  : { color: "#4b5563" }
              }
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                status === s
                  ? { backgroundColor: "#111827", color: "#fff", borderColor: "#111827" }
                  : { color: "#4b5563" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-400">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Joined</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const protectedRow = isProtectedTarget(user?.id, u);
                  const statusKey = accountStatusLabel(u);
                  const isDeleted = Boolean(u.deletedAt);
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 text-gray-700">
                        <p className="font-medium">{getUserDisplayName(u)}</p>
                        <p className="text-xs text-gray-400">{u.id}</p>
                      </td>
                      <td className="py-3 text-gray-500">{u.email || "—"}</td>
                      <td className="py-3">
                        <Badge color={roleColor[u.role || ""] || "gray"}>
                          {u.role || "Unknown"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge color={statusColor[statusKey] || "amber"}>
                          {statusKey}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3">
                        {protectedRow ? (
                          <span className="text-xs text-gray-400">Protected</span>
                        ) : (
                          <div className="flex max-w-md flex-wrap gap-2">
                            {isDeleted ? (
                              <button
                                onClick={() =>
                                  runAction(
                                    u,
                                    () => adminService.restoreUser(u.id),
                                    "User restored.",
                                  )
                                }
                                className="rounded-md border px-2 py-1 text-xs font-semibold"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                {statusKey === "SUSPENDED" || statusKey === "BANNED" ? (
                                  <button
                                    onClick={() =>
                                      runAction(
                                        u,
                                        () => adminService.reactivateUser(u.id),
                                        statusKey === "BANNED"
                                          ? "User unbanned."
                                          : "User reactivated.",
                                      )
                                    }
                                    className="rounded-md border px-2 py-1 text-xs font-semibold"
                                  >
                                    {statusKey === "BANNED" ? "Unban" : "Reactivate"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      runAction(
                                        u,
                                        () => adminService.suspendUser(u.id),
                                        "User suspended. They cannot log in, but posts stay visible.",
                                      )
                                    }
                                    className="rounded-md border px-2 py-1 text-xs font-semibold"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {statusKey !== "BANNED" ? (
                                  <button
                                    onClick={() =>
                                      runAction(
                                        u,
                                        () => adminService.banUser(u.id),
                                        "User banned. Community posts are now hidden.",
                                      )
                                    }
                                    className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"
                                  >
                                    Ban
                                  </button>
                                ) : null}
                                <button
                                  onClick={() =>
                                    runAction(
                                      u,
                                      () => adminService.verifyUserEmail(u.id),
                                      "Email verified.",
                                    )
                                  }
                                  className="rounded-md border px-2 py-1 text-xs font-semibold"
                                >
                                  Verify email
                                </button>
                                <button
                                  onClick={() =>
                                    runAction(
                                      u,
                                      () => adminService.resetUserPassword(u.id),
                                      "Password reset triggered.",
                                    )
                                  }
                                  className="rounded-md border px-2 py-1 text-xs font-semibold"
                                >
                                  Reset password
                                </button>
                                <button
                                  onClick={() => openRoleModal(u)}
                                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700"
                                >
                                  Change role
                                </button>
                                <button
                                  onClick={() =>
                                    runAction(
                                      u,
                                      () => adminService.softDeleteUser(u.id),
                                      "User deleted. Email stays reserved so they cannot re-register.",
                                    )
                                  }
                                  className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {roleModalUser && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-role-title"
          onClick={closeRoleModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="change-role-title" className="text-lg font-bold text-gray-900">
                  Change user role
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a new role for{" "}
                  <span className="font-semibold text-gray-800">
                    {getUserDisplayName(roleModalUser)}
                  </span>
                  , then confirm.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={roleSaving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <span className="text-gray-400">Current role:</span>{" "}
              <span className="font-semibold text-gray-800">
                {roleModalUser.role || "Unknown"}
              </span>
              <br />
              <span className="text-gray-400">Email:</span>{" "}
              <span className="font-medium text-gray-700">{roleModalUser.email || "—"}</span>
            </div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              New role
            </label>
            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ASSIGNABLE_ROLES.map((r) => {
                const isCurrent = String(roleModalUser.role || "").toUpperCase() === r;
                const selected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    disabled={roleSaving}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-60 ${
                      selected
                        ? "border-[#4338CA] bg-[#4338CA]/10 text-[#4338CA]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {formatRoleLabel(r)}
                    {isCurrent && (
                      <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedRole === "ADMIN" && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Granting Admin gives full console access. Only do this for trusted operators.
              </p>
            )}

            <p className="mb-5 text-sm text-gray-600">
              Confirm changing{" "}
              <span className="font-semibold">{getUserDisplayName(roleModalUser)}</span> from{" "}
              <span className="font-semibold">{roleModalUser.role || "Unknown"}</span> to{" "}
              <span className="font-semibold text-[#4338CA]">{selectedRole}</span>?
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={roleSaving}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                disabled={
                  roleSaving ||
                  String(roleModalUser.role || "").toUpperCase() === selectedRole
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: ADMIN_ACCENT }}
              >
                {roleSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Confirm role change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
};

export default AdminUsers;
