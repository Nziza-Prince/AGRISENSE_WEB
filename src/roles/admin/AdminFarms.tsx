import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarClock, Loader2, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, Panel } from "../ui";
import { ADMIN_ACCENT, adminLinks } from "./config";
import FarmDirectory from "./farms/FarmDirectory";
import FarmProfile from "./farms/FarmProfile";
import { EmptyState } from "@/components/EmptyState";
import RegisterFarmerModal from "./forms/RegisterFarmerModal";
import SeasonInsights from "./farms/SeasonInsights";
import { METRICS, orderSeasons } from "./farms/shared";
import { IconAction } from "./users/IconAction";
import {
  ApiError,
  farmRecordsService,
  type AdminFarm,
  type FieldVisit,
  type MonitoringStatus,
  type SeasonRecord,
} from "@/api";

const SOIL_TYPES = ["clay", "sandy", "loamy", "silty", "peaty", "chalky"];

const STATUS_LABEL: Record<MonitoringStatus, string> = {
  normal: "Normal monitoring",
  attention_required: "Attention required",
  alert: "Alert",
};
const STATUS_COLOR: Record<MonitoringStatus, "green" | "amber" | "red"> = {
  normal: "green",
  attention_required: "amber",
  alert: "red",
};

const PLACEHOLDER_EMAIL = /@placeholder\.invalid$/i;

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
const day = (v: string | null) => (v ? v.slice(0, 10) : "");
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "-" : String(v));

const errorText = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) return err.message;
  return fallback;
};

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Message({ error, notice }: { error?: string | null; notice?: string | null }) {
  if (!error && !notice) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {error || notice}
    </p>
  );
}

/* ------------------------------ Farm + farmer ------------------------------ */

function FarmDetails({ farm, onSaved, onCancel }: { farm: AdminFarm; onSaved: (farm: AdminFarm) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    name: farm.name,
    farmCode: text(farm.farmCode),
    upi: text(farm.upi),
    size: text(farm.size),
    soilType: farm.soilType,
    district: farm.district,
    sector: farm.sector,
    cell: farm.cell,
    village: farm.village,
    irrigationMethod: text(farm.irrigationMethod),
    soilInformation: text(farm.soilInformation),
  });
  const [p, setP] = useState({
    firstName: text(farm.user?.firstName),
    lastName: text(farm.user?.lastName),
    email: farm.user?.email ?? farm.ownerEmail,
    phoneNumber: text(farm.user?.phoneNumber),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));
  const setPerson = (k: keyof typeof p) => (e: { target: { value: string } }) =>
    setP((prev) => ({ ...prev, [k]: e.target.value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      // Contact first: it can fail on a duplicate email, and farm save should not hide that.
      await farmRecordsService.updateContact(farm.userId, {
        firstName: p.firstName.trim() || undefined,
        lastName: p.lastName.trim() || undefined,
        email: p.email.trim() || undefined,
        phoneNumber: orNull(p.phoneNumber),
      });
      const updated = await farmRecordsService.updateFarm(farm.id, {
        name: f.name.trim() || undefined,
        farmCode: orNull(f.farmCode),
        upi: orNull(f.upi),
        size: f.size.trim() === "" ? undefined : Number(f.size),
        soilType: f.soilType,
        district: f.district.trim() || undefined,
        sector: f.sector.trim() || undefined,
        cell: f.cell.trim() || undefined,
        village: f.village.trim() || undefined,
        irrigationMethod: orNull(f.irrigationMethod),
        soilInformation: orNull(f.soilInformation),
      });
      onSaved(updated);
      setNotice("Saved.");
    } catch (err) {
      setError(errorText(err, "Could not save."));
    } finally {
      setBusy(false);
    }
  };

  const placeholderEmail = PLACEHOLDER_EMAIL.test(p.email);
  const soilIsPlaceholder = /placeholder/i.test(text(farm.soilInformation));

  return (
    <Panel
      title="Edit farm and farmer details"
      action={
        <button type="button" onClick={onCancel} aria-label="Close editor" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      }
    >
      <form onSubmit={save} className="space-y-6">
        {placeholderEmail && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This farmer has a reserved placeholder email. Enter their real email, or leave it if they
            have none yet.
          </p>
        )}
        {soilIsPlaceholder && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Soil type and size were filled with placeholders. Enter the real values; analysis on this
            farm is only as good as these.
          </p>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Farmer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className={inputClass} value={p.firstName} onChange={setPerson("firstName")} />
            </Field>
            <Field label="Last name">
              <input className={inputClass} value={p.lastName} onChange={setPerson("lastName")} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={p.email} onChange={setPerson("email")} />
            </Field>
            <Field label="Phone number">
              <input className={inputClass} value={p.phoneNumber} onChange={setPerson("phoneNumber")} />
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Farm</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Farm name">
              <input className={inputClass} value={f.name} onChange={set("name")} />
            </Field>
            <Field label="Farm ID" hint="For example SAR-001">
              <input className={inputClass} value={f.farmCode} onChange={set("farmCode")} />
            </Field>
            <Field label="UPI" hint="Land registry parcel number">
              <input className={inputClass} value={f.upi} onChange={set("upi")} />
            </Field>
            <Field label="Size (m²)" hint="Square metres, the same unit the app uses. 10,000 m² is 1 hectare.">
              <input type="number" min="0" step="0.01" className={inputClass} value={f.size} onChange={set("size")} />
            </Field>
            <Field label="Soil type">
              <select className={inputClass} value={f.soilType} onChange={set("soilType")}>
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Irrigation">
              <input className={inputClass} value={f.irrigationMethod} onChange={set("irrigationMethod")} />
            </Field>
            <Field label="District">
              <input className={inputClass} value={f.district} onChange={set("district")} />
            </Field>
            <Field label="Sector">
              <input className={inputClass} value={f.sector} onChange={set("sector")} />
            </Field>
            <Field label="Cell">
              <input className={inputClass} value={f.cell} onChange={set("cell")} />
            </Field>
            <Field label="Village">
              <input className={inputClass} value={f.village} onChange={set("village")} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Soil notes">
              <textarea rows={2} className={inputClass} value={f.soilInformation} onChange={set("soilInformation")} />
            </Field>
          </div>
        </div>

        <Message error={error} notice={notice} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save details"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Panel>
  );
}

/* ------------------------------ Season records ----------------------------- */

const emptyRecord = () => ({
  season: "A",
  seasonYear: String(new Date().getFullYear()),
  selectedCrop: "",
  plantingDate: "",
  expectedHarvestDate: "",
  measuredAt: "",
  moisture: "",
  temperature: "",
  ph: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  ec: "",
  farmCondition: "",
  monitoringStatus: "",
  observations: "",
  recommendedAction: "",
});
type RecordForm = ReturnType<typeof emptyRecord>;

const toForm = (r: SeasonRecord): RecordForm => ({
  season: r.season,
  seasonYear: String(r.seasonYear),
  selectedCrop: text(r.selectedCrop),
  plantingDate: day(r.plantingDate),
  expectedHarvestDate: day(r.expectedHarvestDate),
  measuredAt: day(r.measuredAt),
  moisture: text(r.moisture),
  temperature: text(r.temperature),
  ph: text(r.ph),
  nitrogen: text(r.nitrogen),
  phosphorus: text(r.phosphorus),
  potassium: text(r.potassium),
  ec: text(r.ec),
  farmCondition: text(r.farmCondition),
  monitoringStatus: text(r.monitoringStatus),
  observations: text(r.observations),
  recommendedAction: text(r.recommendedAction),
});

const toPayload = (f: RecordForm) => ({
  season: f.season,
  seasonYear: Number(f.seasonYear),
  selectedCrop: orNull(f.selectedCrop),
  plantingDate: orNull(f.plantingDate),
  expectedHarvestDate: orNull(f.expectedHarvestDate),
  measuredAt: orNull(f.measuredAt),
  moisture: num(f.moisture),
  temperature: num(f.temperature),
  ph: num(f.ph),
  nitrogen: num(f.nitrogen),
  phosphorus: num(f.phosphorus),
  potassium: num(f.potassium),
  ec: num(f.ec),
  farmCondition: orNull(f.farmCondition),
  monitoringStatus: (orNull(f.monitoringStatus) as MonitoringStatus | null) ?? null,
  observations: orNull(f.observations),
  recommendedAction: orNull(f.recommendedAction),
});

function RecordForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: RecordForm;
  submitLabel: string;
  onSubmit: (payload: ReturnType<typeof toPayload>) => Promise<void>;
  onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof RecordForm) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(toPayload(f));
    } catch (err) {
      setError(errorText(err, "Could not save the record."));
      setBusy(false);
    }
  };

  const measure = (k: keyof RecordForm, label: string, step = "0.01") => (
    <Field label={label}>
      <input type="number" step={step} className={inputClass} value={f[k]} onChange={set(k)} />
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border bg-gray-50 p-4">
      <p className="text-xs text-gray-500">
        Fill in only what is known. Leave a field empty if it was not measured or is not known yet.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Season">
          <select className={inputClass} value={f.season} onChange={set("season")}>
            <option value="A">Season A</option>
            <option value="B">Season B</option>
          </select>
        </Field>
        <Field label="Year">
          <input type="number" className={inputClass} value={f.seasonYear} onChange={set("seasonYear")} required />
        </Field>
        <Field label="Selected crop">
          <input className={inputClass} value={f.selectedCrop} onChange={set("selectedCrop")} />
        </Field>
        <Field label="Planting date">
          <input type="date" className={inputClass} value={f.plantingDate} onChange={set("plantingDate")} />
        </Field>
        <Field label="Expected harvest">
          <input type="date" className={inputClass} value={f.expectedHarvestDate} onChange={set("expectedHarvestDate")} />
        </Field>
        <Field label="Measurement date">
          <input type="date" className={inputClass} value={f.measuredAt} onChange={set("measuredAt")} />
        </Field>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Sensor measurements</h4>
        <div className="grid gap-4 sm:grid-cols-4">
          {measure("moisture", "Moisture %")}
          {measure("temperature", "Temperature °C")}
          {measure("ph", "pH")}
          {measure("ec", "EC")}
          {measure("nitrogen", "Nitrogen (N)")}
          {measure("phosphorus", "Phosphorus (P)")}
          {measure("potassium", "Potassium (K)")}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Monitoring output</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Farm condition">
            <input className={inputClass} value={f.farmCondition} onChange={set("farmCondition")} />
          </Field>
          <Field label="Monitoring status">
            <select className={inputClass} value={f.monitoringStatus} onChange={set("monitoringStatus")}>
              <option value="">Not set</option>
              {(Object.keys(STATUS_LABEL) as MonitoringStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observations">
            <textarea rows={2} className={inputClass} value={f.observations} onChange={set("observations")} />
          </Field>
          <Field label="Recommended action">
            <textarea rows={2} className={inputClass} value={f.recommendedAction} onChange={set("recommendedAction")} />
          </Field>
        </div>
      </div>

      <Message error={error} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Saving..." : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Field visits ------------------------------ */

function VisitForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: FieldVisit;
  onSubmit: (body: {
    representative: string | null;
    visitDate: string | null;
    nextMonitoringDate: string | null;
    notes: string | null;
    photoUrls: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    representative: text(initial?.representative),
    visitDate: day(initial?.visitDate ?? null),
    nextMonitoringDate: day(initial?.nextMonitoringDate ?? null),
    notes: text(initial?.notes),
    photos: (initial?.photoUrls ?? []).join("\n"),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        representative: orNull(f.representative),
        visitDate: orNull(f.visitDate),
        nextMonitoringDate: orNull(f.nextMonitoringDate),
        notes: orNull(f.notes),
        photoUrls: f.photos
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(errorText(err, "Could not save the visit."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Representative">
          <input className={inputClass} value={f.representative} onChange={set("representative")} />
        </Field>
        <Field label="Visit date">
          <input type="date" className={inputClass} value={f.visitDate} onChange={set("visitDate")} />
        </Field>
        <Field label="Next monitoring date">
          <input type="date" className={inputClass} value={f.nextMonitoringDate} onChange={set("nextMonitoringDate")} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea rows={2} className={inputClass} value={f.notes} onChange={set("notes")} />
      </Field>
      <Field label="Photo links" hint="One link per line (https://...). Upload the photo elsewhere first, then paste its link.">
        <textarea rows={2} className={inputClass} value={f.photos} onChange={set("photos")} />
      </Field>
      <Message error={error} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save visit"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function RecordCard({ record, onChanged }: { record: SeasonRecord; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [visitFormFor, setVisitFormFor] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(errorText(err, "That did not work."));
    }
  };

  if (editing) {
    return (
      <RecordForm
        initial={toForm(record)}
        submitLabel="Save record"
        onCancel={() => setEditing(false)}
        onSubmit={async (payload) => {
          await farmRecordsService.updateRecord(record.id, payload);
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  const planted = record.plantingDate ? new Date(record.plantingDate).getTime() : null;
  const harvest = record.expectedHarvestDate ? new Date(record.expectedHarvestDate).getTime() : null;
  const progress = planted && harvest && harvest > planted ? Math.min(Math.max((Date.now() - planted) / (harvest - planted), 0), 1) : null;
  const dayLabel = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "not set");
  const statusTone = record.monitoringStatus === "alert" ? "#DC2626" : record.monitoringStatus === "attention_required" ? "#D97706" : "#10B981";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <span className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: record.monitoringStatus ? statusTone : "#C7D2FE" }} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-[#4338CA]">Season {record.season} · {record.seasonYear}</span>
            {record.selectedCrop && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{record.selectedCrop}</span>}
            {record.monitoringStatus && <Badge color={STATUS_COLOR[record.monitoringStatus]}>{STATUS_LABEL[record.monitoringStatus]}</Badge>}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarClock className="h-3.5 w-3.5" /> Measured {dayLabel(record.measuredAt)}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <IconAction icon={Pencil} label="Edit this season" tone="brand" onClick={() => setEditing(true)} />
          <IconAction icon={Trash2} label="Delete this season" tone="danger" confirm onClick={() => run(() => farmRecordsService.deleteRecord(record.id))} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[11px] text-gray-500">
          <span>Planted {dayLabel(record.plantingDate)}</span>
          <span>Harvest {dayLabel(record.expectedHarvestDate)}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          {progress !== null ? (
            <motion.div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-600" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.9 }} />
          ) : (
            <div className="h-2 rounded-full border border-dashed border-gray-200" />
          )}
        </div>
        {progress === null && <p className="mt-1 text-[11px] text-gray-400">Add planting and harvest dates to see the season progress.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {METRICS.map((m, i) => {
          const raw = record[m.key];
          const value = raw === null || raw === undefined || raw === "" ? null : Number(raw);
          const max = m.fixedMax ?? Math.max(value ?? 0, 1) * 1.25;
          return (
            <div key={m.key as string} className="rounded-xl bg-gray-50 p-3">
              <p className="text-[11px] font-medium text-gray-500">{m.label}</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{value === null ? "—" : `${value}${m.unit}`}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-200">
                {value !== null && <motion.div className="h-1.5 rounded-full bg-[#4338CA]" initial={{ width: 0 }} animate={{ width: `${Math.min((value / max) * 100, 100)}%` }} transition={{ delay: i * 0.05, duration: 0.7 }} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-3">
        {[
          ["Farm condition", record.farmCondition],
          ["Observations", record.observations],
          ["Recommended action", record.recommendedAction],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-dashed p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label as string}</p>
            <p className="mt-1 text-gray-800">{show(value)}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Field visits ({record.visits.length})</h4>
          {visitFormFor === null && (
            <button
              type="button"
              onClick={() => setVisitFormFor("new")}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add visit
            </button>
          )}
        </div>

        {visitFormFor === "new" && (
          <VisitForm
            onCancel={() => setVisitFormFor(null)}
            onSubmit={async (body) => {
              await farmRecordsService.createVisit(record.id, body);
              setVisitFormFor(null);
              onChanged();
            }}
          />
        )}

        <ul className="space-y-2">
          {record.visits.map((visit) =>
            visitFormFor === visit.id ? (
              <li key={visit.id}>
                <VisitForm
                  initial={visit}
                  onCancel={() => setVisitFormFor(null)}
                  onSubmit={async (body) => {
                    await farmRecordsService.updateVisit(visit.id, body);
                    setVisitFormFor(null);
                    onChanged();
                  }}
                />
              </li>
            ) : (
              <li key={visit.id} className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">
                    {show(day(visit.visitDate))} · {show(visit.representative)}
                  </p>
                  {visit.notes && <p className="text-gray-600">{visit.notes}</p>}
                  <p className="text-xs text-gray-500">Next monitoring: {show(day(visit.nextMonitoringDate))}</p>
                  {visit.photoUrls && visit.photoUrls.length > 0 && (
                    <p className="flex flex-wrap gap-x-3 text-xs">
                      {visit.photoUrls.map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-700 underline"
                        >
                          Photo {i + 1}
                        </a>
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setVisitFormFor(visit.id)}
                    className="rounded-lg border bg-white p-1.5 text-gray-600"
                    aria-label="Edit field visit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => farmRecordsService.deleteVisit(visit.id), "Delete this field visit?")}
                    className="rounded-lg border bg-white p-1.5 text-red-600"
                    aria-label="Delete field visit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
        {record.visits.length === 0 && visitFormFor === null && (
          <EmptyState art="pin" title="Field visits will appear here" text="Record a visit after you walk the farm." compact />
        )}
      </div>
      <Message error={error} />
    </motion.div>
  );
}

function SeasonRecords({ farmId }: { farmId: string }) {
  const [records, setRecords] = useState<SeasonRecord[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    farmRecordsService
      .listRecords(farmId)
      .then(setRecords)
      .catch((err) => setError(errorText(err, "Could not load season records.")));
  }, [farmId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Season history</h3>
          <p className="text-sm text-gray-500">Every season we have worked with this farm, newest first.</p>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#4338CA] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#3730a3]">
            <Plus className="h-4 w-4" /> Add season record
          </button>
        )}
      </div>

      <Message error={error} />
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <RecordForm
              initial={emptyRecord()}
              submitLabel="Add record"
              onCancel={() => setAdding(false)}
              onSubmit={async (payload) => {
                await farmRecordsService.createRecord(farmId, payload);
                setAdding(false);
                load();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!records ? (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading
        </div>
      ) : records.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed bg-white px-6 py-6">
          <EmptyState art="seedling" title="Season records will appear here" text="Add a season when you have real crop details or sensor measurements. Charts and the timeline build themselves from what you enter.">
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#4338CA] px-4 py-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Add the first season
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <SeasonInsights records={records} />
          <div className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-indigo-100">
            {orderSeasons(records).map((record) => (
              <div key={record.id} className="relative">
                <span className="absolute -left-6 top-6 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#4338CA] shadow" />
                <RecordCard record={record} onChanged={load} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------------------------- Page ----------------------------------- */

const AdminFarms = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [selected, setSelected] = useState<AdminFarm | null>(null);
  const [editing, setEditing] = useState(false);
  const [params] = useSearchParams();
  const wanted = params.get("farm");

  useEffect(() => {
    if (!wanted) return;
    farmRecordsService.getFarm(wanted).then(setSelected).catch(() => undefined);
  }, [wanted]);

  useEffect(() => {
    document.title = "Farms | Admin | AGRISENSE";
  }, []);

  return (
    <RoleLayout
      title="Farms"
      subtitle="Every farm on the platform: where it is, how big, and what we still need to record."
      links={adminLinks}
      accent={ADMIN_ACCENT}
      roleLabel="Admin"
      actions={
        !selected && (
          <button type="button" onClick={() => setRegisterOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#4338CA] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#3730a3]">
            <UserPlus className="h-4 w-4" /> Register farmer and farm
          </button>
        )
      }
    >
      <RegisterFarmerModal open={registerOpen} onClose={() => setRegisterOpen(false)} onCreated={() => setListKey((k) => k + 1)} />
      {selected ? (
        <div className="space-y-6">
          <button type="button" onClick={() => { setSelected(null); setEditing(false); }} className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> All farms
          </button>
          <FarmProfile farm={selected} onEdit={() => setEditing(true)} />
          <AnimatePresence>
            {editing && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <FarmDetails
                  key={selected.id}
                  farm={selected}
                  onSaved={(farm) => {
                    setSelected(farm);
                    setEditing(false);
                  }}
                  onCancel={() => setEditing(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <SeasonRecords farmId={selected.id} />
        </div>
      ) : (
        <FarmDirectory key={listKey} onOpen={setSelected} />
      )}
    </RoleLayout>
  );
};

export default AdminFarms;
