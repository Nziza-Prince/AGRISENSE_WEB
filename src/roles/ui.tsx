import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

/** KPI stat card used across all role dashboards. */
export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaPositive = true,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <p
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            deltaPositive ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {deltaPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {delta}
        </p>
      )}
    </div>
  );
}

/** Section container with a title and optional action. */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** Colored status pill. */
export function Badge({
  children,
  color = "gray",
}: {
  children: ReactNode;
  color?: "green" | "amber" | "red" | "blue" | "gray" | "purple";
}) {
  const map: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}
    >
      {children}
    </span>
  );
}

/** Extract common Nest/API pagination fields from a response. */
export function getPaginationMeta(
  data: unknown,
  page: number,
  limit: number,
  rowCount = 0,
) {
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const meta =
    record.meta && typeof record.meta === "object"
      ? (record.meta as Record<string, unknown>)
      : {};
  const totalRaw = record.total ?? record.count ?? meta.total ?? meta.count;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw)
      ? totalRaw
      : rowCount > 0 && rowCount < limit
        ? (page - 1) * limit + rowCount
        : Math.max(rowCount, page * limit);
  const totalPagesRaw = record.totalPages ?? meta.totalPages;
  const totalPages =
    typeof totalPagesRaw === "number" && totalPagesRaw > 0
      ? totalPagesRaw
      : Math.max(1, Math.ceil(Math.max(total, 1) / limit));
  const hasPrev = page > 1;
  const hasNext =
    page < totalPages ||
    (typeof totalRaw !== "number" && rowCount >= limit);

  return {
    page,
    limit,
    total: typeof totalRaw === "number" ? totalRaw : total,
    totalPages: hasNext && page >= totalPages ? page + 1 : totalPages,
    hasPrev,
    hasNext,
  };
}

/** Simple prev/next pager for admin tables. */
export function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1 && (total === undefined || total <= (limit || 0))) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Page {page} of {Math.max(totalPages, 1)}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
