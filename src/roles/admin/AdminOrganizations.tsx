import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "react-countup";
import { Building2, Check, Loader2, Mail, MapPin, Store, Truck, UserPlus, X, Phone, Star } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type Farm } from "@/api";
import { IconAction } from "./users/IconAction";
import Tip from "./users/Tip";
import CreateOrgForm from "./orgs/CreateOrgForm";
import OrgCoverageMap from "./orgs/OrgCoverageMap";
import OrgReachNetwork from "./orgs/OrgReachNetwork";
import TagSearch, { type TagGroup } from "./orgs/TagSearch";
import { KIND_META, ORG_STATUS, PROVINCES, provinceKey, provinceStats, rowsOf, toOrg, type Org } from "./orgs/shared";
import { initialsOf } from "./users/shared";
import { EmptyState } from "@/components/EmptyState";

const AdminOrganizations = () => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [form, setForm] = useState<"supplier" | "ngo" | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, string | null>>({ kind: null, status: null, province: null });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sup, ngo, pendSup, pendNgo, farmsRes] = await Promise.all([
        adminService.getSuppliers({ page: 1, limit: 100 }).catch(() => ({})),
        adminService.getNgos({ page: 1, limit: 100 }).catch(() => ({})),
        adminService.getPendingSuppliers().catch(() => ({})),
        adminService.getPendingNgos().catch(() => ({})),
        adminService.getAllFarms(1, 500).catch(() => ({ farms: [] as Farm[] })),
      ]);
      const merged = new Map<string, Org>();
      for (const row of rowsOf(sup)) merged.set(String((row as { id: string }).id), toOrg(row, "SUPPLIER"));
      for (const row of rowsOf(pendSup)) merged.set(String((row as { id: string }).id), toOrg(row, "SUPPLIER"));
      for (const row of rowsOf(ngo)) merged.set(String((row as { id: string }).id), toOrg(row, "NGO"));
      for (const row of rowsOf(pendNgo)) merged.set(String((row as { id: string }).id), toOrg(row, "NGO"));
      setOrgs([...merged.values()]);
      setFarms(farmsRes.farms ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Organizations | Admin | AGRISENSE";
    load();
  }, [load]);

  const stats = useMemo(() => provinceStats(orgs, farms), [orgs, farms]);
  const count = (pred: (o: Org) => boolean) => orgs.filter(pred).length;
  const approvedSuppliers = count((o) => o.kind === "SUPPLIER" && o.status === "APPROVED");
  const approvedNgos = count((o) => o.kind === "NGO" && o.status === "APPROVED");
  const pending = count((o) => o.status === "PENDING");
  const covered = stats.filter((s) => s.suppliers.length > 0).length;
  const gaps = stats.filter((s) => s.gap);

  const groups: TagGroup[] = useMemo(
    () => [
      {
        key: "kind",
        label: "type",
        options: (["SUPPLIER", "NGO"] as const).map((k) => ({ value: k, label: KIND_META[k].label, count: count((o) => o.kind === k) })),
      },
      {
        key: "status",
        label: "status",
        options: Object.entries(ORG_STATUS).map(([k, m]) => ({ value: k, label: m.label, dot: m.dot, count: count((o) => o.status === k) })),
      },
      {
        key: "province",
        label: "serves",
        options: PROVINCES.map((p) => ({ value: p, label: p, count: count((o) => o.regions.some((r) => provinceKey(r) === provinceKey(p))) })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgs],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs.filter(
      (o) =>
        (!picked.kind || o.kind === picked.kind) &&
        (!picked.status || o.status === picked.status) &&
        (!picked.province || o.regions.some((r) => provinceKey(r) === provinceKey(picked.province!))) &&
        (!q || [o.name, o.person, o.email, o.location, ...o.tags].join(" ").toLowerCase().includes(q)),
    );
  }, [orgs, picked, query]);

  const act = async (task: () => Promise<unknown>, ok: string) => {
    setError(null);
    setInfo(null);
    try {
      await task();
      setInfo(ok);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  const spotlight = (patch: Record<string, string | null>) => setPicked((cur) => ({ ...cur, ...patch }));

  const kpis = [
    { label: "Suppliers", value: approvedSuppliers, icon: Store, color: KIND_META.SUPPLIER.color, onClick: () => spotlight({ kind: "SUPPLIER", status: "APPROVED" }) },
    { label: "NGOs", value: approvedNgos, icon: Building2, color: KIND_META.NGO.color, onClick: () => spotlight({ kind: "NGO", status: "APPROVED" }) },
    { label: "Awaiting approval", value: pending, icon: Loader2, color: "#F59E0B", onClick: () => spotlight({ kind: null, status: "PENDING" }), pulse: pending > 0 },
    { label: "Provinces with a supplier", value: covered, suffix: ` / ${PROVINCES.length}`, icon: MapPin, color: "#0F766E", onClick: () => spotlight({ kind: "SUPPLIER" }) },
  ];

  return (
    <RoleLayout
      links={adminLinks}
      roleLabel="Admin Console"
      accent={ADMIN_ACCENT}
      title="Organizations"
      subtitle="The suppliers and NGOs on AgriSense, where they work, and where farmers still have nobody nearby."
      actions={
        <>
          <button
            onClick={() => setForm((c) => (c === "ngo" ? null : "ngo"))}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Building2 className="h-4 w-4" />
            Add NGO
          </button>
          <button
            onClick={() => setForm((c) => (c === "supplier" ? null : "supplier"))}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3730a3]"
          >
            <UserPlus className="h-4 w-4" />
            Add supplier
          </button>
        </>
      }
    >
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </motion.div>
        )}
        {info && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {info}
          </motion.div>
        )}
        {form && (
          <motion.div key={form} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <CreateOrgForm
              kind={form}
              onCreated={async () => {
                await load();
                setInfo(`${form === "supplier" ? "Supplier" : "NGO"} created.`);
              }}
              onClose={() => setForm(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#4338CA]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k, i) => (
              <motion.button
                key={k.label}
                type="button"
                onClick={k.onClick}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl border bg-white p-4 text-left shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${k.color}1A`, color: k.color }}>
                  <k.icon className={`h-[18px] w-[18px] ${k.pulse ? "animate-pulse" : ""}`} />
                </span>
                <span className="mt-3 block text-3xl font-bold text-gray-900">
                  <CountUp end={k.value} duration={1} />
                  {k.suffix && <span className="text-lg font-semibold text-gray-400">{k.suffix}</span>}
                </span>
                <span className="text-xs text-gray-500">{k.label}</span>
              </motion.button>
            ))}
          </div>

          {gaps.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Coverage gap:</span>{" "}
              {gaps.map((g) => `${g.province} has ${g.farms} farm${g.farms === 1 ? "" : "s"} and no approved supplier`).join("; ")}.
            </motion.div>
          )}

          <Panel title="Coverage map" className="mt-6">
            <OrgCoverageMap orgs={orgs} farms={farms} />
          </Panel>

          <Panel title="Who reaches which province" className="mt-6">
            <OrgReachNetwork orgs={orgs} farms={farms} />
            <p className="mt-2 text-xs text-gray-500">
              Solid lines are approved organisations, dashed amber lines are waiting for approval. Bigger green dots mean more farms.
            </p>
          </Panel>

          <Panel className="mt-6">
            <div className="mb-4">
              <TagSearch
                query={query}
                onQuery={setQuery}
                groups={groups}
                selected={picked}
                onSelect={(group, value) => setPicked((cur) => ({ ...cur, [group]: value }))}
                placeholder="Search organisations, or filter by type, status and province…"
              />
            </div>
            <p className="mb-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{shown.length}</span> of {orgs.length} organisations
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((o, i) => {
                  const kind = KIND_META[o.kind];
                  const status = ORG_STATUS[o.status] ?? ORG_STATUS.PENDING;
                  const approve = () =>
                    act(() => (o.kind === "SUPPLIER" ? adminService.approveSupplier(o.userId) : adminService.approveNgo(o.userId)), `${o.name} approved.`);
                  const reject = () =>
                    act(() => (o.kind === "SUPPLIER" ? adminService.rejectSupplier(o.userId, {}) : adminService.rejectNgo(o.userId, {})), `${o.name} rejected.`);
                  return (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(i, 8) * 0.04 }}
                      whileHover={{ y: -3 }}
                      className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm"
                      style={{ borderTop: `3px solid ${status.dot}` }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: kind.tint, color: kind.color }}>
                          {initialsOf(o.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-semibold leading-snug text-gray-900">{o.name}</p>
                          <p className="truncate text-xs text-gray-500">{o.person || o.email}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${status.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${o.status === "PENDING" ? "animate-pulse" : ""}`} style={{ background: status.dot }} />
                          {status.label}
                        </span>
                      </div>

                      {o.description && <p className="mt-3 line-clamp-2 text-xs text-gray-500">{o.description}</p>}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: kind.tint, color: kind.color }}>
                          {kind.label}
                        </span>
                        {o.tags.map((t) => (
                          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {PROVINCES.map((p) => {
                          const on = o.regions.some((r) => provinceKey(r) === provinceKey(p));
                          return (
                            <span key={p} className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${on ? "bg-indigo-100 text-[#4338CA]" : "bg-gray-50 text-gray-300 line-through"}`}>
                              {p.replace(" Province", "").replace("Kigali City", "Kigali")}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {o.kind === "SUPPLIER" && (
                            <>
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-amber-400" />
                                {o.ratingCount ? o.rating.toFixed(1) : "No ratings"}
                              </span>
                              <Tip text={o.delivery ? "Delivers to farms" : "No delivery"}>
                                <Truck className={`h-4 w-4 ${o.delivery ? "text-emerald-500" : "text-gray-300"}`} />
                              </Tip>
                            </>
                          )}
                          {o.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {o.district ?? o.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {o.status !== "APPROVED" && <IconAction icon={Check} label="Approve" tone="good" onClick={approve} />}
                          {o.status !== "REJECTED" && <IconAction icon={X} label="Reject" tone="danger" onClick={reject} confirm />}
                          {o.email && (
                            <Tip text={o.email}>
                              <a href={`mailto:${o.email}`} aria-label="Email" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-indigo-50 hover:text-[#4338CA]">
                                <Mail className="h-[17px] w-[17px]" />
                              </a>
                            </Tip>
                          )}
                          {o.phone && (
                            <Tip text={o.phone}>
                              <a href={`tel:${o.phone}`} aria-label="Call" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-indigo-50 hover:text-[#4338CA]">
                                <Phone className="h-[17px] w-[17px]" />
                              </a>
                            </Tip>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {shown.length === 0 && <EmptyState art="search" title="No organisations match" text="Try clearing a filter." compact />}
          </Panel>
        </>
      )}
    </RoleLayout>
  );
};

export default AdminOrganizations;
