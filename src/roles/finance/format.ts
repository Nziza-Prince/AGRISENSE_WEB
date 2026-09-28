import type { FinanceRangePreset, FinanceTransactionStatus } from "@/api";

export function formatRwf(amount?: number | null) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function statusBadgeColor(
  status?: string,
): "green" | "amber" | "red" | "gray" | "blue" | "purple" {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
      return "green";
    case "PENDING":
    case "DRAFT":
      return "amber";
    case "REJECTED":
      return "red";
    case "CANCELLED":
      return "gray";
    default:
      return "blue";
  }
}

export function accountTypeLabel(type?: string) {
  switch ((type || "").toUpperCase()) {
    case "BANK":
      return "Bank";
    case "CASH":
      return "Cash";
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "PAYMENT_PLATFORM":
      return "Payment platform";
    default:
      return "Other";
  }
}

export function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const body = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const RANGE_PRESETS: Array<{ id: FinanceRangePreset; label: string }> = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "quarter", label: "This quarter" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
];

export function canEditStatus(status?: FinanceTransactionStatus | string) {
  const value = (status || "").toUpperCase();
  return value === "DRAFT" || value === "PENDING";
}
