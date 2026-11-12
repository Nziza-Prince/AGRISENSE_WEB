import type { AdminFarm, SeasonRecord } from "@/api";

export const SOIL_COLOR: Record<string, string> = {
  loamy: "#B45309",
  clay: "#BE123C",
  clayey: "#BE123C",
  sandy: "#CA8A04",
  silty: "#0F766E",
  alluvial: "#0F766E",
  peaty: "#475569",
  chalky: "#94A3B8",
};
export const soilColor = (soil?: string) => SOIL_COLOR[(soil || "").toLowerCase()] ?? "#64748B";

/** Farm size is stored in square metres everywhere (the mobile app, the API, the public counters). */
export const sizeM2 = (farm: AdminFarm) => Number(farm.size) || 0;

export function formatArea(m2: number) {
  if (!m2) return "Not recorded";
  return m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} ha` : `${m2.toLocaleString("en-US")} m²`;
}

const PLACEHOLDER_EMAIL = /@placeholder\.invalid$/i;
const hasGps = (f: AdminFarm) => f.latitude != null && f.longitude != null && f.latitude !== "" && f.longitude !== "";

export interface Check {
  key: string;
  label: string;
  ok: boolean;
}

/** What we still do not know about a farm. Pilot farms start with placeholders, so this shows real gaps. */
export function checksFor(f: AdminFarm): Check[] {
  const email = f.user?.email ?? f.ownerEmail ?? "";
  return [
    { key: "size", label: "Size", ok: sizeM2(f) > 0 },
    { key: "soil", label: "Soil details", ok: !/placeholder/i.test(f.soilInformation ?? "placeholder") },
    { key: "email", label: "Email", ok: Boolean(email) && !PLACEHOLDER_EMAIL.test(email) },
    { key: "phone", label: "Phone", ok: Boolean(f.user?.phoneNumber || f.ownerPhone) },
    { key: "gps", label: "GPS", ok: hasGps(f) },
    { key: "irrigation", label: "Irrigation", ok: Boolean(f.irrigationMethod) },
  ];
}

export const scoreOf = (f: AdminFarm) => {
  const checks = checksFor(f);
  return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
};

export interface Tile<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Area-proportional treemap: split the list in two balanced halves and cut the rectangle along its long side. */
export function treemap<T>(items: Array<{ item: T; value: number }>, x: number, y: number, w: number, h: number): Tile<T>[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ item: items[0].item, x, y, w, h }];
  const total = items.reduce((s, i) => s + i.value, 0);
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value;
    cut = i + 1;
    if (acc >= total / 2) break;
  }
  const a = items.slice(0, cut);
  const b = items.slice(cut);
  const share = a.reduce((s, i) => s + i.value, 0) / total;
  return w >= h
    ? [...treemap(a, x, y, w * share, h), ...treemap(b, x + w * share, y, w * (1 - share), h)]
    : [...treemap(a, x, y, w, h * share), ...treemap(b, x, y + h * share, w, h * (1 - share))];
}

export const orderSeasons = (records: SeasonRecord[]) =>
  [...records].sort((a, b) => b.seasonYear - a.seasonYear || b.season.localeCompare(a.season));

export const METRICS: Array<{ key: keyof SeasonRecord; label: string; unit: string; fixedMax?: number }> = [
  { key: "moisture", label: "Moisture", unit: "%", fixedMax: 100 },
  { key: "temperature", label: "Temperature", unit: "°C", fixedMax: 50 },
  { key: "ph", label: "pH", unit: "", fixedMax: 14 },
  { key: "nitrogen", label: "Nitrogen (N)", unit: "" },
  { key: "phosphorus", label: "Phosphorus (P)", unit: "" },
  { key: "potassium", label: "Potassium (K)", unit: "" },
  { key: "ec", label: "EC", unit: "" },
];

