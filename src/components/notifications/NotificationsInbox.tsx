import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { ArrowRight, Bell, CheckCheck, CreditCard, Loader2, Trash2, UserPlus } from "lucide-react";
import { ApiError, notificationService, type NotificationItem } from "@/api";
import {
  emitNotificationsChanged,
  formatNotificationTime,
  getNotificationBody,
  getNotificationRows,
  getNotificationTitle,
  isNotificationUnread,
} from "./helpers";

interface NotificationsInboxProps {
  accent?: string;
  /** Where to send the user to act on a notification, if anywhere. */
  linkFor?: (item: NotificationItem) => { to: string; label: string } | null;
}

const dayLabel = (iso?: string) => {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

function iconFor(item: NotificationItem) {
  const text = `${item.type ?? ""} ${item.title ?? ""}`.toLowerCase();
  if (/pay|billing|subscription|season/.test(text)) return CreditCard;
  if (/account|user|register|approv|supplier|ngo/.test(text)) return UserPlus;
  return Bell;
}

export function NotificationsInbox({ accent = "#2C6E49", linkFor }: NotificationsInboxProps) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.list({ page: 1, limit: 50 });
      setItems(getNotificationRows(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Notifications | AGRISENSE";
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((item) => isNotificationUnread(item)).length,
    [items],
  );

  const visible = useMemo(() => (tab === "unread" ? items.filter(isNotificationUnread) : items), [items, tab]);

  const markRead = async (id: string) => {
    setActionError(null);
    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true, read: true } : item)),
      );
      emitNotificationsChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not mark as read.");
    }
  };

  const markAllRead = async () => {
    setActionError(null);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true, read: true })));
      emitNotificationsChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not mark all as read.");
    }
  };

  const remove = async (id: string) => {
    setActionError(null);
    try {
      await notificationService.deleteOne(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      emitNotificationsChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete notification.");
    }
  };

  const clearAll = async () => {
    setActionError(null);
    try {
      await notificationService.clearAll();
      setItems([]);
      emitNotificationsChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not clear notifications.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 sm:w-fit">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            {t === "all" ? `All (${items.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || actionError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: accent }} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState art="bell" title="Your alerts will appear here" text="Alerts about farms, orders, billing and account activity will appear here." />
      ) : (
        <div className="space-y-6">
          {Object.entries(
            visible.reduce<Record<string, NotificationItem[]>>((acc, item) => {
              const key = dayLabel(item.createdAt);
              (acc[key] ||= []).push(item);
              return acc;
            }, {}),
          ).map(([day, group]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{day}</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <AnimatePresence initial={false}>
                  {group.map((item, index) => {
                    const unread = isNotificationUnread(item);
                    const Icon = iconFor(item);
                    const link = linkFor?.(item);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ delay: Math.min(index, 6) * 0.03 }}
                        className={`flex items-start gap-3 px-4 py-4 sm:px-5 ${index > 0 ? "border-t border-gray-100" : ""} ${unread ? "bg-indigo-50/40" : "bg-white hover:bg-gray-50/80"}`}
                      >
                        <div className="relative mt-0.5 shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}14`, color: accent }}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: accent }} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-sm text-gray-900 ${unread ? "font-bold" : "font-semibold"}`}>{getNotificationTitle(item)}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{getNotificationBody(item)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span>{formatNotificationTime(item.createdAt) || (item.createdAt ? new Date(item.createdAt).toLocaleString() : "")}</span>
                            {link && (
                              <Link to={link.to} onClick={() => unread && markRead(item.id)} className="inline-flex items-center gap-1 font-semibold" style={{ color: accent }}>
                                {link.label} <ArrowRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {unread && (
                            <button type="button" onClick={() => markRead(item.id)} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Mark as read" title="Mark as read">
                              <CheckCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" onClick={() => remove(item.id)} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label="Delete notification" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>
          ))}
          {visible.length === 0 && <EmptyState art="calm" title="You are all caught up" text="New alerts appear here as they come in." compact />}
        </div>
      )}
    </div>
  );
}
