import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { ApiError, notificationService, type NotificationItem } from "@/api";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  emitNotificationsChanged,
  formatNotificationTime,
  getNotificationBody,
  getNotificationRows,
  getNotificationTitle,
  isNotificationUnread,
} from "./helpers";

interface NotificationBellProps {
  inboxHref: string;
  accent?: string;
}

export function NotificationBell({
  inboxHref,
  accent = "#2C6E49",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.count || res.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.list({ page: 1, limit: 8 });
      setItems(getNotificationRows(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const onChanged = () => {
      refreshCount();
      if (open) loadPreview();
    };
    const onFocus = () => refreshCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(refreshCount, 60000);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [refreshCount, loadPreview, open]);

  useEffect(() => {
    if (!open) return;
    loadPreview();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, loadPreview]);

  const markRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true, read: true } : item)),
      );
      emitNotificationsChanged();
    } catch {
      /* keep panel open */
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true, read: true })));
      emitNotificationsChanged();
    } catch {
      /* ignore */
    }
  };

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:bg-gray-50"
                style={{ color: accent }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <EmptyState art="bell" title="Alerts will appear here" text="Farm, order and account updates land here." compact />
            ) : (
              <ul>
                {items.map((item) => {
                  const unread = isNotificationUnread(item);
                  return (
                    <li key={item.id} className="border-b border-gray-50 last:border-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (unread) void markRead(item.id);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          unread ? "bg-emerald-50/40" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              unread ? "" : "bg-transparent"
                            }`}
                            style={unread ? { backgroundColor: accent } : undefined}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm ${
                                unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                              }`}
                            >
                              {getNotificationTitle(item)}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {getNotificationBody(item)}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {formatNotificationTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
            <Link
              to={inboxHref}
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-semibold"
              style={{ color: accent }}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
