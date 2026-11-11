import type { FinancePaymentMethod, FinanceRangePreset, FinanceTransactionStatus } from "@/api";

export function formatRwf(amount?: number | null) {
  const value = Math.round(Number(amount) || 0);
  const sign = value < 0 ? "-" : "";
  return `${sign}RWF ${Math.abs(value).toLocaleString("en-US")}`;
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

export const PAYMENT_METHODS: Array<{ id: FinancePaymentMethod; label: string; hint: string }> = [
  { id: "CASH", label: "Cash", hint: "Paid by hand" },
  { id: "MOBILE_MONEY", label: "Mobile money", hint: "MTN / Airtel" },
  { id: "BANK_TRANSFER", label: "Bank transfer", hint: "Bank deposit" },
  { id: "CHEQUE", label: "Cheque", hint: "Paper cheque" },
  { id: "OTHER", label: "Other", hint: "Anything else" },
];

export function paymentMethodLabel(method?: string) {
  return PAYMENT_METHODS.find((item) => item.id === (method || "").toUpperCase())?.label || "Other";
}

export function paymentMethodColor(method?: string): "green" | "amber" | "blue" | "purple" | "gray" {
  switch ((method || "").toUpperCase()) {
    case "CASH":
      return "green";
    case "MOBILE_MONEY":
      return "amber";
    case "BANK_TRANSFER":
      return "blue";
    case "CHEQUE":
      return "purple";
    default:
      return "gray";
  }
}

export function seasonPassStatusLabel(status?: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "submitted":
      return "Awaiting confirmation";
    case "awaiting_payment":
      return "Not yet paid";
    case "rejected":
      return "Rejected";
    default:
      return status || "Unknown";
  }
}

export function seasonPassStatusColor(status?: string): "green" | "amber" | "red" | "gray" {
  switch (status) {
    case "paid":
      return "green";
    case "submitted":
      return "amber";
    case "rejected":
      return "red";
    default:
      return "gray";
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
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

export function canEditStatus(status?: FinanceTransactionStatus | string) {
  const value = (status || "").toUpperCase();
  return value === "DRAFT" || value === "PENDING" || value === "APPROVED";
}

/** Month key like "2026-02" as "Feb 2026". */
export function formatMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
