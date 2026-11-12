import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Bell, CheckCircle2, Loader2, Send, Users } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import { adminService, ApiError, type AdminUserRole, type AdminUserSummary } from "@/api";
import { ROLE_META, ROLE_ORDER, roleOf, statusOf } from "./users/shared";

const AUDIENCES: Array<{ value: "" | AdminUserRole; label: string }> = [
  { value: "", label: "Everyone" },
  { value: "FARMER", label: "Farmers" },
  { value: "SUPPLIER", label: "Suppliers" },
  { value: "NGO", label: "NGOs" },
  { value: "CFO", label: "Finance" },
];

const TITLE_MAX = 80;
const MESSAGE_MAX = 500;

type Ping = { ok: boolean; ms: number } | null;

export const AdminSettings = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"" | AdminUserRole>("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ping, setPing] = useState<Ping>(null);

  useEffect(() => {
    document.title = "Settings | Admin | AGRISENSE";
    adminService
      .getUsers({ page: 1, limit: 100 })
      .then((res) => setUsers(((res as { users?: AdminUserSummary[]; items?: AdminUserSummary[] }).users ?? (res as { items?: AdminUserSummary[] }).items ?? [])))
      .catch(() => undefined);
    const started = performance.now();
    adminService
      .getOverviewStatistics()
      .then(() => setPing({ ok: true, ms: Math.round(performance.now() - started) }))
      .catch(() => setPing({ ok: false, ms: Math.round(performance.now() - started) }));
  }, []);

  const reach = useMemo(() => {
    const live = users.filter((u) => statusOf(u) === "ACTIVE");
    const counts = Object.fromEntries(ROLE_ORDER.map((r) => [r, live.filter((u) => roleOf(u) === r).length]));
    return { counts, total: live.length };
  }, [users]);

  const audienceCount = target ? reach.counts[target] ?? 0 : reach.total;
  const audienceLabel = AUDIENCES.find((a) => a.value === target)?.label ?? "Everyone";
  const ready = title.trim().length >= 3 && message.trim().length >= 5;

  const send = async () => {
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      await adminService.broadcastAnnouncement({ title: title.trim(), message: message.trim(), ...(target ? { targetRole: target } : {}) });
      setInfo(`Sent to ${audienceLabel.toLowerCase()} (${audienceCount} active ${audienceCount === 1 ? "account" : "accounts"}).`);
      setTitle("");
      setMessage("");
      setTarget("");
      setConfirming(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send the announcement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <RoleLayout links={adminLinks} roleLabel="Admin Console" accent={ADMIN_ACCENT} title="Settings" subtitle="Talk to everyone on the platform and check that it is healthy.">
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </motion.div>
        )}
        {info && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> {info}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid items-start gap-6 xl:grid-cols-5">
        <Panel title="Write an announcement" className="xl:col-span-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Who should get it</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((a) => {
              const n = a.value ? reach.counts[a.value] ?? 0 : reach.total;
              const on = target === a.value;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setTarget(a.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${on ? "border-[#4338CA] bg-[#4338CA] text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {a.label}
                  <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>{n}</span>
                </button>
              );
            })}
          </div>

          <label className="mt-5 block text-sm font-medium text-gray-700">
            Title
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="For example: Planting season advice for Season B"
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/10"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Message
            <textarea
              value={message}
              maxLength={MESSAGE_MAX}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Keep it short and say what the person should do."
              className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/10"
            />
            <span className="mt-1 block text-right text-xs text-gray-400">{message.length}/{MESSAGE_MAX}</span>
          </label>

          <div className="mt-4 flex items-center justify-end gap-3">
            {confirming ? (
              <>
                <span className="text-sm text-gray-600">Send to {audienceCount} active {audienceCount === 1 ? "account" : "accounts"}?</span>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                <button type="button" onClick={send} disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Yes, send
                </button>
              </>
            ) : (
              <button type="button" disabled={!ready} onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                <Send className="h-4 w-4" /> Review and send
              </button>
            )}
          </div>
        </Panel>

        <div className="space-y-6 xl:col-span-2">
          <Panel title="What they will see">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#4338CA]">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-gray-900">{title || "Your title appears here"}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">{message || "Your message appears here, in the notification bell and inbox."}</p>
                  <p className="mt-2 text-xs text-gray-400">Just now · from AgriSense</p>
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" /> Goes to {audienceCount} active {audienceCount === 1 ? "account" : "accounts"}: {audienceLabel.toLowerCase()}.
            </p>
          </Panel>

          <Panel title="Platform health">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ping ? (ping.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600") : "bg-gray-100 text-gray-400"}`}>
                {ping ? <Activity className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{ping ? (ping.ok ? "The API is answering" : "The API did not answer") : "Checking…"}</p>
                {ping && <p className="text-xs text-gray-500">{ping.ok ? `Responded in ${ping.ms} ms` : "Check that the backend is running."}</p>}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ROLE_ORDER.map((r) => (
                <span key={r} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: ROLE_META[r].tint, color: ROLE_META[r].text }}>
                  {ROLE_META[r].label} {reach.counts[r] ?? 0}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">Active accounts by role.</p>
          </Panel>
        </div>
      </div>
    </RoleLayout>
  );
};
