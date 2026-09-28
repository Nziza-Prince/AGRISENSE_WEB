import { useEffect, useMemo, useState } from "react";
import { Users, Store, Building2, Sprout, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import RoleLayout from "../RoleLayout";
import { StatCard, Panel, Badge } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  adminService,
  ApiError,
  type AdminFarmStatistics,
  type AdminOverviewStatistics,
  type AdminUserSummary,
} from "@/api";
import { getUserDisplayName } from "@/lib/user";

const roleColor: Record<string, "green" | "amber" | "red" | "blue" | "gray" | "purple"> = {
  FARMER: "green",
  SUPPLIER: "blue",
  NGO: "purple",
  GOVERNMENT: "amber",
  ADMIN: "gray",
  CFO: "blue",
};

const statusColor: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green",
  PENDING: "amber",
  SUSPENDED: "amber",
  BANNED: "red",
  DELETED: "gray",
};

function getUserRows(data: unknown): AdminUserSummary[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const rows = record.users ?? record.items ?? record.data;
  return Array.isArray(rows) ? (rows as AdminUserSummary[]) : [];
}

function getNumberValue(data: AdminFarmStatistics | null, keys: string[]): number {
  if (!data) return 0;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function formatRole(role?: string) {
  if (!role) return "Unknown";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatStatus(status?: string, deletedAt?: string | null) {
  if (deletedAt) return "Deleted";
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [farmStats, setFarmStats] = useState<AdminFarmStatistics | null>(null);
  const [overview, setOverview] = useState<AdminOverviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Dashboard | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, farmStatsRes, overviewRes] = await Promise.all([
          adminService.getUsers({ page: 1, limit: 100 }),
          adminService.getFarmStatistics(),
          adminService.getOverviewStatistics(),
        ]);
        if (!active) return;

        const rows = getUserRows(usersRes);
        setUsers(rows);
        setUsersTotal(
          typeof overviewRes.totalUsers === "number"
            ? overviewRes.totalUsers
            : typeof usersRes.total === "number"
              ? usersRes.total
              : typeof usersRes.count === "number"
                ? usersRes.count
                : rows.length,
        );
        setFarmStats(farmStatsRes);
        setOverview(overviewRes);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Failed to load admin dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
      const role = user.role || "UNKNOWN";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = users.reduce<Record<string, number>>((acc, user) => {
      const status = user.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const roleSplit = Object.entries(roleCounts).map(([name, value], index) => ({
      name: formatRole(name),
      value,
      color: ["#4338CA", "#6366F1", "#8B5CF6", "#C4B5FD", "#A5B4FC"][index % 5],
    }));

    return { roleCounts, statusCounts, roleSplit };
  }, [users]);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 8),
    [users],
  );

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Admin Overview"
      subtitle="Platform-wide users, growth and moderation."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={overview?.totalUsers ?? (usersTotal || users.length)}
          delta={`${overview?.activeUsers ?? summary.statusCounts.ACTIVE ?? 0} active`}
          accent={ADMIN_ACCENT}
        />
        <StatCard
          icon={Store}
          label="Suppliers"
          value={summary.roleCounts.SUPPLIER || 0}
          delta={`${overview?.pendingSuppliers ?? summary.statusCounts.PENDING ?? 0} pending`}
          accent={ADMIN_ACCENT}
        />
        <StatCard
          icon={Building2}
          label="NGOs / Gov"
          value={(summary.roleCounts.NGO || 0) + (summary.roleCounts.GOVERNMENT || 0)}
          delta={`${overview?.pendingNgos ?? 0} NGO pending · ${summary.roleCounts.ADMIN || 0} admins`}
          accent={ADMIN_ACCENT}
        />
        <StatCard
          icon={Sprout}
          label="Total Farms"
          value={
            overview?.totalFarms ??
            getNumberValue(farmStats, ["totalFarms", "count", "total"])
          }
          delta={`${getNumberValue(farmStats, ["activeFarms"])} active`}
          accent={ADMIN_ACCENT}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Farm Statistics" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Average Farm Size</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {getNumberValue(farmStats, ["averageFarmSize", "avgFarmSize"]).toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Archived Farms</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {getNumberValue(farmStats, ["archivedFarms"])}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Active Accounts</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {overview?.activeUsers ?? summary.statusCounts.ACTIVE ?? 0}
              </p>
            </div>
          </div>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading overview…
            </div>
          )}
        </Panel>

        <Panel title="Users by Role">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.roleSplit}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {summary.roleSplit.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Recent Users" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-800">{getUserDisplayName(u)}</td>
                    <td className="py-3 text-gray-500">{u.email || "—"}</td>
                    <td className="py-3">
                      <Badge color={roleColor[u.role || ""] || "gray"}>
                        {formatRole(u.role)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge color={statusColor[u.deletedAt ? "DELETED" : u.status || ""] || "amber"}>
                        {formatStatus(u.status, u.deletedAt)}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Account Status">
          <div className="space-y-3">
            {Object.entries(summary.statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-700">{formatStatus(status)}</span>
                <Badge color={statusColor[status] || "amber"}>{count}</Badge>
              </div>
            ))}
            {!Object.keys(summary.statusCounts).length && (
              <div className="text-sm text-gray-500">No user status data available yet.</div>
            )}
          </div>
        </Panel>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;
