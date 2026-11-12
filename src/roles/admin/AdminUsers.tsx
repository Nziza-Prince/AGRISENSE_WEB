import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, MapPinned, Sprout, UserPlus, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, PaginationControls, getPaginationMeta } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type AdminUserRole, type AdminUserStatus, type AdminUserSummary } from "@/api";
import { useAuth } from "@/context/useAuth";
import { getUserDisplayName } from "@/lib/user";
import StaffAccountsPanel from "./StaffAccountsPanel";
import AddUserModal from "./forms/AddUserModal";
import RegisterFarmerModal from "./forms/RegisterFarmerModal";
import { EmptyState } from "@/components/EmptyState";
import UserOrbit from "./users/UserOrbit";
import UserRowActions from "./users/UserRowActions";
import UserSmartFilter from "./users/UserSmartFilter";
import { ROLE_META, STATUS_META, initialsOf, joinedOf, nameOf, roleOf, statusOf } from "./users/shared";

const PAGE_SIZE = 20;
const ASSIGNABLE_ROLES: AdminUserRole[] = ["FARMER", "SUPPLIER", "NGO", "CFO", "ADMIN"];

type SortKey = "name" | "role" | "status" | "joined";

function getUsers(data: unknown): AdminUserSummary[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.users ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as AdminUserSummary[]) : [];
}

function isProtectedTarget(actorId: string | undefined, target: AdminUserSummary) {
  if (actorId && target.id === actorId) return true;
  return roleOf(target) === "ADMIN";
}

function formatRoleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function countBy(users: AdminUserSummary[], pick: (u: AdminUserSummary) => string) {
  return users.reduce<Record<string, number>>((acc, u) => {
    const key = pick(u);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const AdminUsers = () => {
  const { user } = useAuth();
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [farmerOpen, setFarmerOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [everyone, setEveryone] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "joined", dir: -1 });

  const [roleModalUser, setRoleModalUser] = useState<AdminUserSummary | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>("FARMER");
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    document.title = "Users | Admin | AGRISENSE";
  }, []);

  const loadEveryone = useCallback(async () => {
    try {
      setEveryone(getUsers(await adminService.getUsers({ page: 1, limit: 100 })));
    } catch {
      // The orbit is a bonus; the table reports its own errors.
    }
  }, []);

  const load = useCallback(
    async (nextPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getUsers({
          page: nextPage,
          limit: PAGE_SIZE,
          role: (role as AdminUserRole) || undefined,
          status: !status || status === "DELETED" ? undefined : (status as AdminUserStatus),
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
    },
    [role, status, query],
  );

  // Typing searches live: wait a moment after the last key so we do not hit the server on every letter.
  useEffect(() => {
    const timer = window.setTimeout(() => load(1), query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    loadEveryone();
  }, [loadEveryone]);

  const refresh = async () => {
    await Promise.all([load(page), loadEveryone()]);
  };

  const roleCounts = useMemo(() => countBy(everyone, roleOf), [everyone]);
  const statusCounts = useMemo(() => countBy(everyone, statusOf), [everyone]);

  const rows = useMemo(() => {
    const value = (u: AdminUserSummary) => {
      switch (sort.key) {
        case "name":
          return nameOf(u).toLowerCase();
        case "role":
          return roleOf(u);
        case "status":
          return statusOf(u);
        default:
          return new Date(u.createdAt || 0).getTime();
      }
    };
    return [...users].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [users, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((cur) => (cur.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: key === "joined" ? -1 : 1 }));

  const openRoleModal = (target: AdminUserSummary) => {
    setError(null);
    setInfo(null);
    if (isProtectedTarget(user?.id, target)) {
      setError("You cannot modify your own account or another admin.");
      return;
    }
    const current = roleOf(target) as AdminUserRole;
    setSelectedRole(ASSIGNABLE_ROLES.includes(current) ? current : "FARMER");
    setRoleModalUser(target);
  };

  const closeRoleModal = () => {
    if (roleSaving) return;
    setRoleModalUser(null);
  };

  const confirmRoleChange = async () => {
    if (!roleModalUser) return;
    if (roleOf(roleModalUser) === selectedRole) {
      setInfo("That user already has this role.");
      setRoleModalUser(null);
      return;
    }
    setRoleSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminService.updateUserRole(roleModalUser.id, selectedRole);
      setInfo(`Role updated: ${getUserDisplayName(roleModalUser)} is now ${formatRoleLabel(selectedRole)}.`);
      setRoleModalUser(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const runAction = async (target: AdminUserSummary, task: () => Promise<unknown>, okMsg?: string) => {
    setInfo(null);
    setError(null);
    if (isProtectedTarget(user?.id, target)) {
      setError("You cannot modify your own account or another admin.");
      return;
    }
    try {
      await task();
      if (okMsg) setInfo(okMsg);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  const SortHead = ({ k, children }: { k: SortKey; children: string }) => {
    const Icon = sort.key !== k ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th className="px-3 py-3 font-semibold">
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1.5 uppercase tracking-wide transition hover:text-gray-900 ${
            sort.key === k ? "text-gray-900" : ""
          }`}
        >
          {children}
          <Icon className="h-3 w-3" />
        </button>
      </th>
    );
  };

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Users"
      subtitle="Everyone on AgriSense, by role and status. Suspend pauses login, ban hides community posts, delete keeps the email reserved."
      actions={
        <>
          <button
            onClick={() => setRegionsOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <MapPinned className="h-4 w-4" />
            NGO provinces
          </button>
          <button
            onClick={() => setAddUserOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#4338CA] bg-white px-3 py-2 text-sm font-semibold text-[#4338CA] hover:bg-indigo-50"
          >
            <UserPlus className="h-4 w-4" />
            Add user
          </button>
          <button
            onClick={() => setFarmerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3730a3]"
          >
            <Sprout className="h-4 w-4" />
            Register farmer
          </button>
        </>
      }
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
        {info && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {info}
          </motion.div>
        )}
      </AnimatePresence>
      {regionsOpen && <StaffAccountsPanel onChanged={refresh} onClose={() => setRegionsOpen(false)} />}
      <AddUserModal open={addUserOpen} onClose={() => setAddUserOpen(false)} onCreated={refresh} />
      <RegisterFarmerModal open={farmerOpen} onClose={() => setFarmerOpen(false)} onCreated={() => void refresh()} />

      <Panel className="mb-6">
        <UserOrbit
          users={everyone}
          statusCounts={statusCounts}
          activeStatus={status}
          onStatus={setStatus}
          onPick={(u) => {
            setRole(null);
            setStatus(null);
            setQuery(u.email || nameOf(u));
          }}
        />
      </Panel>

      <Panel>
        <div className="mb-4">
          <UserSmartFilter
            query={query}
            role={role}
            status={status}
            roleCounts={roleCounts}
            statusCounts={statusCounts}
            onQuery={setQuery}
            onRole={setRole}
            onStatus={setStatus}
          />
        </div>

        <p className="mb-3 text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{rows.length}</span> of{" "}
          <span className="font-semibold text-gray-800">{total}</span> accounts
          {loading && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-gray-400" />}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500">
                <SortHead k="name">User</SortHead>
                <SortHead k="role">Role</SortHead>
                <SortHead k="status">Status</SortHead>
                <SortHead k="joined">Joined</SortHead>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <motion.tbody layout>
              <AnimatePresence mode="popLayout" initial={false}>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState art="search" title="No one matches" text="Try clearing a filter." compact />
                    </td>
                  </tr>
                ) : (
                  rows.map((u, i) => {
                    const statusKey = statusOf(u);
                    const roleKey = roleOf(u);
                    const meta = STATUS_META[statusKey];
                    const roleMeta = ROLE_META[roleKey];
                    const name = nameOf(u);
                    return (
                      <motion.tr
                        key={u.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
                        className="group border-b border-gray-50 last:border-0 hover:bg-indigo-50/40"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white"
                              style={{ background: roleMeta?.tint ?? "#E5E7EB", color: roleMeta?.text ?? "#374151" }}
                            >
                              {initialsOf(name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">{name}</p>
                              <p className="truncate text-xs text-gray-500">{u.email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ background: roleMeta?.tint ?? "#E5E7EB", color: roleMeta?.text ?? "#374151" }}
                          >
                            {roleMeta?.label ?? (roleKey || "Unknown")}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                              meta?.pill ?? "bg-gray-100 text-gray-500 ring-gray-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusKey === "PENDING" ? "animate-pulse" : ""}`}
                              style={{ background: meta?.dot ?? "#9CA3AF" }}
                            />
                            {meta?.label ?? statusKey}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-500">{joinedOf(u)}</td>
                        <td className="px-3 py-3">
                          <UserRowActions
                            status={statusKey}
                            locked={isProtectedTarget(user?.id, u)}
                            on={{
                              suspend: () =>
                                runAction(u, () => adminService.suspendUser(u.id), "User suspended. They cannot log in, but posts stay visible."),
                              reactivate: () => runAction(u, () => adminService.reactivateUser(u.id), "User reactivated."),
                              ban: () => runAction(u, () => adminService.banUser(u.id), "User banned. Community posts are now hidden."),
                              unban: () => runAction(u, () => adminService.reactivateUser(u.id), "User unbanned."),
                              verify: () => runAction(u, () => adminService.verifyUserEmail(u.id), "Email verified."),
                              reset: () => runAction(u, () => adminService.resetUserPassword(u.id), "Password reset triggered."),
                              changeRole: () => openRoleModal(u),
                              remove: () =>
                                runAction(u, () => adminService.softDeleteUser(u.id), "User deleted. Email stays reserved so they cannot re-register."),
                              restore: () => runAction(u, () => adminService.restoreUser(u.id), "User restored."),
                            }}
                          />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.tbody>
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
