import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, Panel } from "../ui";
import { EmptyState } from "@/components/EmptyState";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  ApiError,
  adminService,
  farmRecordsService,
  sensorService,
  type AdminFarm,
  type AdminSensor,
  type AdminUserSummary,
} from "@/api";

type SortKey = "name" | "email" | "phone" | "status" | "farms" | "district" | "sensors" | "joined";

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  farms: number;
  district: string;
  sensors: number;
  joined: number;
}

const PLACEHOLDER_EMAIL = /@placeholder\.invalid$/i;
const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green",
  PENDING: "amber",
  SUSPENDED: "red",
  BANNED: "red",
};

const sortValue = (r: Row, k: SortKey): string | number =>
  k === "name" ? r.name.toLowerCase()
  : k === "email" ? r.email.toLowerCase()
  : k === "phone" ? r.phone
  : k === "status" ? r.status
  : k === "district" ? r.district.toLowerCase()
  : r[k];

const AdminFarmers = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "joined", dir: -1 });

  useEffect(() => {
    document.title = "Farmers | Admin | AGRISENSE";
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, farmsRes, sensorsRes] = await Promise.all([
        adminService.getUsers({ role: "FARMER", limit: 100 }),
        farmRecordsService.listFarms().catch(() => ({ farms: [] as AdminFarm[] })),
        sensorService.list().catch(() => ({ devices: [] as AdminSensor[] })),
      ]);
      const list: AdminUserSummary[] = (users.users ?? users.data ?? []) as AdminUserSummary[];
      setRows(
        list.map((u) => {
          const mine = farmsRes.farms.filter((f) => f.userId === u.id);
          return {
            id: u.id,
            name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unnamed",
            email: u.email && !PLACEHOLDER_EMAIL.test(u.email) ? u.email : "",
            phone: u.phoneNumber ?? "",
            status: String(u.status ?? ""),
            farms: mine.length,
            district: mine[0]?.district ?? "",
            sensors: sensorsRes.devices.filter((d) => d.ownerId === u.id).length,
            joined: u.createdAt ? Date.parse(u.createdAt) : 0,
          };
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load farmers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => [r.name, r.email, r.phone, r.district, r.status].some((v) => v.toLowerCase().includes(q)))
      : rows;
    return [...list].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      return (x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name)) * sort.dir;
    });
  }, [rows, query, sort]);

  const SortHead = ({ k, children }: { k: SortKey; children: string }) => {
    const Icon = sort.key !== k ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th className="whitespace-nowrap px-3 py-3 font-semibold">
        <button
          type="button"
          onClick={() =>
            setSort((c) => (c.key === k ? { key: k, dir: c.dir === 1 ? -1 : 1 } : { key: k, dir: k === "joined" ? -1 : 1 }))
          }
          className={`inline-flex items-center gap-1.5 uppercase tracking-wide transition hover:text-gray-900 ${sort.key === k ? "text-gray-900" : ""}`}
        >
          {children}
          <Icon className="h-3 w-3" />
        </button>
      </th>
    );
  };

  return (
    <RoleLayout
      title="Farmers"
      subtitle="Everyone registered as a farmer, with their farms and sensors"
      links={adminLinks}
      accent={ADMIN_ACCENT}
      roleLabel="Admin"
    >
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Panel
        title="Farmers"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, district"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{shown.length}</span> of{" "}
            <span className="font-semibold text-gray-800">{rows.length}</span> farmers
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading farmers
          </div>
        ) : rows.length === 0 ? (
          <EmptyState art="search" title="No farmers yet" text="Farmers appear here as soon as they register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500">
                  <SortHead k="name">Farmer</SortHead>
                  <SortHead k="email">Email</SortHead>
                  <SortHead k="phone">Phone</SortHead>
                  <SortHead k="status">Status</SortHead>
                  <SortHead k="farms">Farms</SortHead>
                  <SortHead k="district">District</SortHead>
                  <SortHead k="sensors">Sensors</SortHead>
                  <SortHead k="joined">Joined</SortHead>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">No farmer matches "{query}".</td>
                  </tr>
                ) : (
                  shown.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-indigo-50/40">
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-900">{r.name}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-700">{r.email || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-700">{r.phone || "—"}</td>
                      <td className="px-3 py-3">
                        <Badge color={STATUS_COLOR[r.status] ?? "gray"}>{r.status ? r.status.charAt(0) + r.status.slice(1).toLowerCase() : "—"}</Badge>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{r.farms}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-700">{r.district || "—"}</td>
                      <td className="px-3 py-3 text-gray-700">{r.sensors}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                        {r.joined ? new Date(r.joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default AdminFarmers;
