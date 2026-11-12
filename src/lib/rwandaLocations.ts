import { useEffect, useState } from "react";

/** Province → district → sector → cell → villages, for all of Rwanda (5 / 30 / 416 / 2,149 / 14,837). */
export type RwandaLocations = Record<string, Record<string, Record<string, Record<string, string[]>>>>;

let cache: RwandaLocations | null = null;
let pending: Promise<RwandaLocations> | null = null;

/** The list is about 190 KB, so it loads on first use instead of going into the main bundle. */
export function loadRwandaLocations(): Promise<RwandaLocations> {
  if (cache) return Promise.resolve(cache);
  pending ??= import("@/data/rwandaLocations.json").then((m) => {
    cache = (m.default ?? m) as RwandaLocations;
    return cache;
  });
  return pending;
}

export function useRwandaLocations(): RwandaLocations | null {
  const [data, setData] = useState<RwandaLocations | null>(cache);
  useEffect(() => {
    let live = true;
    if (!cache) void loadRwandaLocations().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  return data;
}

const byName = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });
export const sortedKeys = (o?: object) => (o ? Object.keys(o).sort(byName) : []);

/** The province a district belongs to, so a farm saved without one can still show it. */
export function provinceOfDistrict(data: RwandaLocations | null, district?: string | null): string {
  if (!data || !district) return "";
  return Object.keys(data).find((p) => district in data[p]) ?? "";
}

export type Place = { province: string; district: string; sector: string; cell: string; village: string };
export const emptyPlace: Place = { province: "", district: "", sector: "", cell: "", village: "" };
