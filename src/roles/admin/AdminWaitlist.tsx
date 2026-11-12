import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Loader2, Mail, Ban, Copy, Check, Users, MailCheck, UserX } from "lucide-react";
import { IconAction } from "./users/IconAction";
import { initialsOf } from "./users/shared";
import { EmptyState } from "@/components/EmptyState";
import RoleLayout from "../RoleLayout";
import { Panel, PaginationControls, getPaginationMeta } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { ApiError, waitlistService, type WaitlistEntry, type WaitlistStats } from "@/api";

const PAGE_SIZE = 20;

function getEntries(data: unknown): WaitlistEntry[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.entries ?? record.waitlist ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as WaitlistEntry[]) : [];
}

const AdminWaitlist = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        waitlistService.list({ page: nextPage, limit: PAGE_SIZE }),
        waitlistService.stats().catch(() => null),
      ]);
      const rows = getEntries(listRes);
      const meta = getPaginationMeta(listRes, nextPage, PAGE_SIZE, rows.length);
      setEntries(rows);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load waitlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Waitlist | Admin | AGRISENSE";
    load(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; load is recreated each render
  }, []);

  const run = async (task: () => Promise<unknown>, ok: string) => {
    setInfo(null);
    try {
      await task();
      setInfo(ok);
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
      title="Waitlist"
      subtitle="Manage early-access signups and promotional emails."
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "On the waitlist", value: stats?.total ?? total, icon: Users, color: "#4338CA" },
          { label: "Active", value: stats?.active ?? 0, icon: Check, color: "#10B981" },
          { label: "Inactive", value: stats?.inactive ?? 0, icon: UserX, color: "#64748B" },
          { label: "Emails sent", value: stats?.emailsSent ?? 0, icon: MailCheck, color: "#B45309" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="rounded-2xl border bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${k.color}1A`, color: k.color }}>
              <k.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="mt-3 block text-3xl font-bold text-gray-900">
              <CountUp end={Number(k.value) || 0} duration={1} />
            </span>
            <span className="text-xs text-gray-500">{k.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <Panel title={`Signups (${total || entries.length})`} className="xl:col-span-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#4338CA]" />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState art="waitlist" title="Nobody has joined yet" text="Share the signup page. People who join appear here with their welcome email status." />
          ) : (
            <>
              <ul className="divide-y">
                {entries.map((entry, i) => {
                  const inactive = entry.isActive === false || Boolean(entry.deactivatedAt) || String(entry.status || "").toUpperCase() === "INACTIVE";
                  return (
                    <motion.li key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-[#4338CA]">
                        {initialsOf(entry.fullName || entry.email)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{entry.fullName || entry.email}</p>
                        <p className="truncate text-xs text-gray-500">
                          {entry.email} · {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${inactive ? "bg-gray-100 text-gray-500 ring-gray-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: inactive ? "#9CA3AF" : "#10B981" }} />
                        {inactive ? "Inactive" : "Active"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <IconAction icon={Mail} label="Resend welcome email" tone="brand" onClick={() => run(() => waitlistService.resendEmail(entry.id), "Welcome email resent.")} />
                        {!inactive && <IconAction icon={Ban} label="Deactivate" tone="danger" confirm onClick={() => run(() => waitlistService.deactivate(entry.id), "Entry deactivated.")} />}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
              <PaginationControls page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE} disabled={loading} onPageChange={(next) => load(next)} />
            </>
          )}
        </Panel>

        <Panel title="Invite people">
          <p className="text-sm text-gray-600">Send this page to anyone who should join early. Their welcome email goes out automatically.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border bg-gray-50 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-700">{`${window.location.origin}/`}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/`).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4338CA] px-3 py-1.5 text-xs font-semibold text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">The waitlist form is on the landing page.</p>
        </Panel>
      </div>
    </RoleLayout>
  );
};

export default AdminWaitlist;
