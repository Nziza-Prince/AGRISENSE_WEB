import type { AdminUserSummary } from "@/api";

/** Inner rings are staff, the outer ring is the largest group (farmers). */
export const ROLE_ORDER = ["ADMIN", "CFO", "NGO", "SUPPLIER", "FARMER"] as const;
export const STATUS_ORDER = ["ACTIVE", "PENDING", "SUSPENDED", "BANNED"] as const;

export const STATUS_META: Record<string, { label: string; dot: string; pill: string }> = {
  ACTIVE: { label: "Active", dot: "#10B981", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  PENDING: { label: "Pending", dot: "#F59E0B", pill: "bg-amber-50 text-amber-700 ring-amber-200" },
  SUSPENDED: { label: "Suspended", dot: "#F97316", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  BANNED: { label: "Banned", dot: "#EF4444", pill: "bg-red-50 text-red-700 ring-red-200" },
  DELETED: { label: "Deleted", dot: "#9CA3AF", pill: "bg-gray-100 text-gray-500 ring-gray-200" },
};

export const ROLE_META: Record<string, { label: string; tint: string; text: string }> = {
  FARMER: { label: "Farmer", tint: "#D1FAE5", text: "#047857" },
  SUPPLIER: { label: "Supplier", tint: "#DBEAFE", text: "#1D4ED8" },
  NGO: { label: "NGO", tint: "#EDE9FE", text: "#6D28D9" },
  CFO: { label: "Finance", tint: "#CFFAFE", text: "#0E7490" },
  ADMIN: { label: "Admin", tint: "#E0E7FF", text: "#4338CA" },
};

export const roleOf = (u: AdminUserSummary) => String(u.role || "").toUpperCase();

export const statusOf = (u: AdminUserSummary) =>
  u.deletedAt ? "DELETED" : String(u.status || "UNKNOWN").toUpperCase();

export const nameOf = (u: AdminUserSummary) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Unknown";

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export const joinedOf = (u: AdminUserSummary) =>
  u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
