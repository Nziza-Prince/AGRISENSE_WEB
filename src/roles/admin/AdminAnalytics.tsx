import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CheckCircle2, Loader2, Ruler, ShieldAlert, Sprout, Users, UserCheck, type LucideIcon } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import {
  adminService,
  type AdminAuditLog,
  type AdminOverviewStatistics,
  type AdminUserSummary,
  type Farm,
} from "@/api";
import { ActivityCalendar, Funnel, HourProfile, PeopleWaffle, SizeStrip, SoilStrata, type WaffleItem } from "./analytics/charts";
import { ROLE_ORDER, nameOf, roleOf, statusOf } from "./users/shared";
import { soilColor } from "./farms/shared";

const ROLE_COLOR: Record<string, string> = {
  FARMER: "#0F766E",
  SUPPLIER: "#1D4ED8",
  NGO: "#6D28D9",
  CFO: "#0E7490",
  ADMIN: "#4338CA",
};
const ROLE_NAME: Record<string, string> = {
  FARMER: "Farmers",
  SUPPLIER: "Suppliers",
  NGO: "NGOs",
  CFO: "Finance",
  ADMIN: "Admins",
};

function rowsOf<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  const rec = (data ?? {}) as Record<string, unknown>;
  for (const k of keys) if (Array.isArray(rec[k])) return rec[k] as T[];
  return [];
}

const DAY = 86400000;

function Tile({ icon: Icon, label, value, decimals = 0, sub, color, good }: { icon: LucideIcon; label: string; value: number; decimals?: number; sub: string; color: string; good?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}1A`, color }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        <CountUp end={value} decimals={decimals} duration={1} />
      </p>
      <p className={`mt-1 text-xs ${good ? "font-medium text-emerald-600" : "text-gray-500"}`}>{sub}</p>
    </motion.div>
  );
}

const AdminAnalytics = () => {
  const [overview, setOverview] = useState<AdminOverviewStatistics | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Analytics | Admin | AGRISENSE";
    (async () => {
      const [o, u, f, l] = await Promise.all([
        adminService.getOverviewStatistics().catch(() => null),
        adminService.getUsers({ page: 1, limit: 100 }).catch(() => ({})),
        adminService.getAllFarms(1, 500).catch(() => ({ farms: [] as Farm[] })),
        adminService.getAuditLogs(1, 1000).catch(() => ({})),
      ]);
      setOverview(o);
      setUsers(rowsOf<AdminUserSummary>(u, ["users", "items", "data"]));
      setFarms((f as { farms?: Farm[] }).farms ?? []);
      setLogs(rowsOf<AdminAuditLog>(l, ["logs", "items", "data"]));
    })().finally(() => setLoading(false));
  }, []);

  const now = useMemo(() => new Date(), []);

  const kpi = useMemo(() => {
    const total = overview?.totalUsers ?? users.length;
    const active = overview?.activeUsers ?? users.filter((u) => statusOf(u) === "ACTIVE").length;
    const recent = users.filter((u) => u.createdAt && now.getTime() - new Date(u.createdAt).getTime() < 30 * DAY).length;
    const area = farms.reduce((s, f) => s + (Number(f.size) || 0), 0);
    const sized = farms.filter((f) => Number(f.size) > 0).length;
    const orgs = users.filter((u) => ["SUPPLIER", "NGO"].includes(roleOf(u))).length;
    const attention = (overview?.pendingSuppliers ?? 0) + (overview?.pendingNgos ?? 0) + (overview?.reportedPosts ?? 0);
    return {
      total, active, recent, area, sized, orgs, attention,
      districts: new Set(farms.map((f) => f.district)).size,
      suppliers: users.filter((u) => roleOf(u) === "SUPPLIER").length,
      ngos: users.filter((u) => roleOf(u) === "NGO").length,
    };
  }, [overview, users, farms, now]);

  const signups = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const u of users) {
      if (!u.createdAt) continue;
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    }
    let running = 0;
    return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count, total: (running += count) }));
  }, [users]);

  const byDistrict = useMemo(() => {
    const map = farms.reduce<Record<string, number>>((a, f) => ({ ...a, [f.district || "Unknown"]: (a[f.district || "Unknown"] || 0) + 1 }), {});
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [farms]);

  const waffle = useMemo(() => {
    const items: WaffleItem[] = [...users]
      .sort((a, b) => ROLE_ORDER.indexOf(roleOf(a) as (typeof ROLE_ORDER)[number]) - ROLE_ORDER.indexOf(roleOf(b) as (typeof ROLE_ORDER)[number]))
      .map((u) => {
        const s = statusOf(u);
        return {
          id: u.id,
          group: ROLE_NAME[roleOf(u)] ?? roleOf(u),
          color: ROLE_COLOR[roleOf(u)] ?? "#64748B",
          dim: s === "BANNED" || s === "SUSPENDED",
          dashed: s === "PENDING",
          label: `${nameOf(u)} · ${ROLE_NAME[roleOf(u)] ?? roleOf(u)} · ${s.toLowerCase()}`,
        };
      });
    const legend = ROLE_ORDER.map((r) => ({ group: ROLE_NAME[r], color: ROLE_COLOR[r], count: users.filter((u) => roleOf(u) === r).length })).filter((l) => l.count > 0);
    return { items, legend };
  }, [users]);

  const strata = useMemo(() => {
    const map = new Map<string, { m2: number; farms: number }>();
    for (const f of farms) {
      const m2 = Number(f.size) || 0;
      if (!m2) continue;
      const k = String(f.soilType).toLowerCase();
      const cur = map.get(k) ?? { m2: 0, farms: 0 };
      map.set(k, { m2: cur.m2 + m2, farms: cur.farms + 1 });
    }
    return [...map.entries()].map(([name, v]) => ({ name, color: soilColor(name), ...v })).sort((a, b) => b.m2 - a.m2);
  }, [farms]);

  const dots = useMemo(
    () =>
      farms
        .filter((f) => Number(f.size) > 0)
        .map((f) => ({ id: f.id, lane: f.district || "Unknown", m2: Number(f.size), color: soilColor(String(f.soilType)), label: `${f.name} · ${Number(f.size).toLocaleString("en-US")} m² · ${f.soilType}` })),
    [farms],
  );

  const activity = useMemo(() => {
    const counts: Record<string, number> = {};
    const hours = Array.from({ length: 24 }, () => 0);
    let total = 0;
    for (const log of logs) {
      if (!log.createdAt || log.action === "TOKEN_REFRESH") continue;
      const key = new Date(log.createdAt).toLocaleDateString("en-CA");
      counts[key] = (counts[key] || 0) + 1;
      hours[new Date(log.createdAt).getHours()] += 1;
      total += 1;
    }
    const busiest = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { counts, hours, total, busiest };
  }, [logs]);

  const funnel = useMemo(() => {
    const owners = new Set(farms.map((f) => (f as unknown as { userId?: string }).userId));
    // Each step keeps only the people who also passed the step before it, so the bars can only shrink.
    const registered = users.filter((u) => roleOf(u) === "FARMER" && !u.deletedAt);
    const verified = registered.filter((u) => u.isEmailVerified === true);
    const onboarded = verified.filter((u) => u.onboardingCompleted === true);
    const withFarm = onboarded.filter((u) => owners.has(u.id));
    return [
      { label: "Registered farmers", value: registered.length },
      { label: "Verified their email", value: verified.length },
      { label: "Finished onboarding", value: onboarded.length },
      { label: "Registered a farm", value: withFarm.length },
    ];
  }, [users, farms]);

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Analytics"
      subtitle="How the platform is growing, who is on it and what land it covers. Security and change history live in Audit logs."
      actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : undefined}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Tile icon={Users} label="People" value={kpi.total} sub={`${kpi.recent} joined in the last 30 days`} color="#4338CA" />
        <Tile icon={UserCheck} label="Active accounts" value={kpi.active} sub={`${kpi.total ? Math.round((kpi.active / kpi.total) * 100) : 0}% of everyone`} color="#10B981" />
        <Tile icon={Sprout} label="Farms" value={farms.length} sub={`across ${kpi.districts} district${kpi.districts === 1 ? "" : "s"}`} color="#0F766E" />
        <Tile icon={Ruler} label="Hectares recorded" value={Math.round((kpi.area / 10000) * 10) / 10} decimals={1} sub={`${kpi.sized} of ${farms.length} farms have a size`} color="#B45309" />
        <Tile icon={Building2} label="Organisations" value={kpi.orgs} sub={`${kpi.suppliers} supplier${kpi.suppliers === 1 ? "" : "s"} · ${kpi.ngos} NGO${kpi.ngos === 1 ? "" : "s"}`} color="#6D28D9" />
        <Tile
          icon={kpi.attention ? ShieldAlert : CheckCircle2}
          label="Needs your attention"
          value={kpi.attention}
          sub={kpi.attention ? "approvals and reports waiting" : "Nothing is waiting"}
          color={kpi.attention ? "#F59E0B" : "#10B981"}
          good={!kpi.attention}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12">
        <Panel title="Sign-ups per month" className="md:col-span-6 xl:col-span-8">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={signups} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="New users" fill="#6366F1" radius={[6, 6, 0, 0]} />
                <Line dataKey="total" name="Total users" stroke="#1E1B4B" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Everyone on the platform" className="md:col-span-6 xl:col-span-4">
          <PeopleWaffle items={waffle.items} legend={waffle.legend} />
          <p className="mt-3 text-center text-[11px] text-gray-400">One square per person. Dashed: pending. Faded: suspended or banned.</p>
        </Panel>

        <Panel title="Farms by district" className="md:col-span-6 xl:col-span-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDistrict} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Farms" fill="#4338CA" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="How big the farms are" className="md:col-span-6 xl:col-span-5">
          <SizeStrip dots={dots} />
          <p className="mt-2 text-[11px] text-gray-400">Each dot is a farm on a log scale, the black tick is the district median. Colour is soil type.</p>
        </Panel>
        <Panel title="Soil under our farms" className="md:col-span-6 xl:col-span-3">
          <SoilStrata layers={strata} />
          <p className="mt-2 text-[11px] text-gray-400">Layer thickness is the share of recorded area.</p>
        </Panel>

        <Panel title="Platform activity, last 16 weeks" className="md:col-span-6 xl:col-span-8">
          <ActivityCalendar counts={activity.counts} today={now} />
          <p className="mb-2 mt-5 text-xs font-semibold text-gray-700">Busiest hours of the day</p>
          <HourProfile hours={activity.hours} />
          <p className="mt-3 text-xs text-gray-500">
            {activity.total.toLocaleString()} recorded events
            {activity.busiest && ` · busiest day ${new Date(activity.busiest[0]).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} with ${activity.busiest[1]}`}
          </p>
        </Panel>
        <Panel title="From sign-up to a working farm" className="md:col-span-6 xl:col-span-4">
          <Funnel steps={funnel} />
          {(() => {
            const drops = funnel.slice(1).map((step, i) => ({ step, lost: funnel[i].value - step.value, from: funnel[i].label }));
            const worst = drops.sort((a, b) => b.lost - a.lost)[0];
            return worst && worst.lost > 0 ? (
              <div className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <span className="font-semibold">Biggest drop:</span> {worst.lost} {worst.lost === 1 ? "farmer" : "farmers"} did not go from{" "}
                {worst.from.toLowerCase()} to {worst.step.label.toLowerCase()}.
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">Nobody is dropping out between steps.</div>
            );
          })()}
          <p className="mt-3 text-[11px] text-gray-400">Pilot farmers added by the team have placeholder emails, so they count as not verified.</p>
        </Panel>
      </div>
    </RoleLayout>
  );
};

export default AdminAnalytics;
