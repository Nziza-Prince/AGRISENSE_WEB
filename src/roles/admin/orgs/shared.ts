import type { Farm } from "@/api";
import { DISTRICTS } from "../rwandaMap";

export type OrgKind = "SUPPLIER" | "NGO";

export interface Org {
  id: string;
  /** Account id of the holder: this is what approve and reject take. */
  userId: string;
  kind: OrgKind;
  name: string;
  person: string;
  email: string;
  phone: string;
  status: string;
  regions: string[];
  tags: string[];
  location: string;
  district: string | null;
  description: string;
  rating: number;
  ratingCount: number;
  delivery: boolean;
  createdAt?: string;
}

export const PROVINCES = ["Northern Province", "Southern Province", "Eastern Province", "Western Province", "Kigali City"] as const;

export const KIND_META: Record<OrgKind, { label: string; color: string; tint: string }> = {
  SUPPLIER: { label: "Supplier", color: "#1D4ED8", tint: "#DBEAFE" },
  NGO: { label: "NGO", color: "#6D28D9", tint: "#EDE9FE" },
};

export const ORG_STATUS: Record<string, { label: string; dot: string; pill: string }> = {
  APPROVED: { label: "Approved", dot: "#10B981", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  PENDING: { label: "Pending", dot: "#F59E0B", pill: "bg-amber-50 text-amber-700 ring-amber-200" },
  REJECTED: { label: "Rejected", dot: "#EF4444", pill: "bg-red-50 text-red-700 ring-red-200" },
};

const norm = (v: string) => v.trim().toLowerCase().replace(/\s+(province|city)$/, "");

/** Older saves may spell a province differently; show the standard spelling. */
export const standardProvince = (value: string) => PROVINCES.find((p) => norm(p) === norm(value)) ?? value;

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];

/** Finds a district name inside free text such as "Nyagatare town, Nyagatare District". */
export function districtIn(text: string): string | null {
  const lower = text.toLowerCase();
  return DISTRICTS.find((d) => lower.includes(d.name.toLowerCase()))?.name ?? null;
}

type Raw = Record<string, unknown> & { user?: Record<string, unknown> };

export function toOrg(raw: unknown, kind: OrgKind): Org {
  const row = raw as Raw;
  const user = (row.user ?? {}) as Record<string, unknown>;
  const first = String(user.firstName ?? "");
  const last = String(user.lastName ?? "");
  const location = String(row.businessLocation ?? "");
  const regions = kind === "SUPPLIER" ? asList(row.serviceRegions) : asList(user.assignedRegions);
  return {
    id: String(row.id),
    userId: String(row.userId ?? user.id ?? row.id),
    kind,
    name: String((kind === "SUPPLIER" ? row.businessName : row.organizationName) || `${first} ${last}`.trim() || user.email || "Unnamed"),
    person: `${first} ${last}`.trim(),
    email: String(row.contactEmail || user.email || ""),
    phone: String(row.contactPhone || user.phoneNumber || ""),
    status: String(row.approvalStatus || "PENDING").toUpperCase(),
    regions: regions.map(standardProvince),
    tags: kind === "SUPPLIER" ? (row.businessCategory ? [String(row.businessCategory)] : []) : asList(row.focusAreas),
    location,
    district: location ? districtIn(location) : null,
    description: String(row.businessDescription ?? row.description ?? ""),
    rating: Number(row.rating) || 0,
    ratingCount: Number(row.ratingCount) || 0,
    delivery: Boolean(row.deliveryCapability),
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
  };
}

export function rowsOf(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  const rec = (res ?? {}) as Record<string, unknown>;
  for (const key of ["items", "suppliers", "ngos", "data"]) if (Array.isArray(rec[key])) return rec[key] as unknown[];
  return [];
}

export const provinceKey = (p: string) => norm(p);

export interface ProvinceStat {
  province: string;
  farms: number;
  suppliers: Org[];
  ngos: Org[];
  gap: boolean;
}

export function provinceStats(orgs: Org[], farms: Farm[]): ProvinceStat[] {
  return PROVINCES.map((province) => {
    const key = provinceKey(province);
    const serving = orgs.filter((o) => o.status === "APPROVED" && o.regions.some((r) => provinceKey(r) === key));
    const farmCount = farms.filter((f) => provinceKey(f.province || "") === key).length;
    const suppliers = serving.filter((o) => o.kind === "SUPPLIER");
    return { province, farms: farmCount, suppliers, ngos: serving.filter((o) => o.kind === "NGO"), gap: farmCount > 0 && suppliers.length === 0 };
  });
}

