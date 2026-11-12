import { Field, SelectInput } from "./inputs";
import { emptyPlace, provinceOfDistrict, sortedKeys, useRwandaLocations, type Place } from "@/lib/rwandaLocations";

/** Keeps a saved value visible even if it is not in the official list, so editing never blanks it. */
function withCurrent(options: string[], current: string) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

/**
 * Province, district, sector, cell and village, each picked from the official list for the level above.
 * Nothing is typed by hand; changing one level clears the levels below it.
 */
export default function LocationPicker({ value, onChange }: { value: Place; onChange: (next: Place) => void }) {
  const data = useRwandaLocations();
  const province = value.province || provinceOfDistrict(data, value.district);

  const districts = withCurrent(sortedKeys(data?.[province]), value.district);
  const sectors = withCurrent(sortedKeys(data?.[province]?.[value.district]), value.sector);
  const cells = withCurrent(sortedKeys(data?.[province]?.[value.district]?.[value.sector]), value.cell);
  const villages = withCurrent([...(data?.[province]?.[value.district]?.[value.sector]?.[value.cell] ?? [])].sort((a, b) => a.localeCompare(b, "en", { numeric: true })), value.village);

  const set = (next: Partial<Place>) => onChange({ ...value, province, ...next });
  const wait = !data;
  const hint = (ready: boolean, above: string, what: string) => (wait ? "Loading places…" : ready ? `Choose a ${what}…` : `Pick a ${above} first`);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Province">
          <SelectInput value={province} disabled={wait} onChange={(e) => onChange({ ...emptyPlace, province: e.target.value })}>
            <option value="">{wait ? "Loading places…" : "Choose a province…"}</option>
            {sortedKeys(data ?? undefined).map((p) => <option key={p}>{p}</option>)}
          </SelectInput>
        </Field>
        <Field label="District">
          <SelectInput value={value.district} disabled={wait || !province} onChange={(e) => onChange({ ...emptyPlace, province, district: e.target.value })}>
            <option value="">{hint(!!province, "province", "district")}</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </SelectInput>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sector">
          <SelectInput value={value.sector} disabled={wait || !value.district} onChange={(e) => onChange({ ...emptyPlace, province, district: value.district, sector: e.target.value })}>
            <option value="">{hint(!!value.district, "district", "sector")}</option>
            {sectors.map((s) => <option key={s}>{s}</option>)}
          </SelectInput>
        </Field>
        <Field label="Cell">
          <SelectInput value={value.cell} disabled={wait || !value.sector} onChange={(e) => set({ cell: e.target.value, village: "" })}>
            <option value="">{hint(!!value.sector, "sector", "cell")}</option>
            {cells.map((c) => <option key={c}>{c}</option>)}
          </SelectInput>
        </Field>
        <Field label="Village">
          <SelectInput value={value.village} disabled={wait || !value.cell} onChange={(e) => set({ village: e.target.value })}>
            <option value="">{hint(!!value.cell, "cell", "village")}</option>
            {villages.map((v) => <option key={v}>{v}</option>)}
          </SelectInput>
        </Field>
      </div>
    </>
  );
}
