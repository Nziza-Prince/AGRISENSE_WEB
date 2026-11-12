import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Loader2, MapPin, Sprout, User } from "lucide-react";
import { adminService, ApiError } from "@/api";
import { soilColor } from "../farms/shared";
import Modal from "./Modal";
import { ChipGroup, Field, PasswordField, TextInput } from "./inputs";
import { PASSWORD_RULE } from "./password";
import LocationPicker from "./LocationPicker";

const SOILS = ["loamy", "clay", "sandy", "silty", "peaty", "chalky"] as const;
const IRRIGATION = ["Rain-fed", "Drip", "Sprinkler", "Furrow", "Manual watering"];

const empty = () => ({
  firstName: "", lastName: "", phone: "", email: "", password: "",
  farmName: "", size: "", soil: "loamy" as (typeof SOILS)[number], irrigation: "",
  province: "", district: "", sector: "", cell: "", village: "", lat: "", lng: "", farmCode: "",
});

const STEPS = [
  { title: "The farmer", icon: User },
  { title: "The farm", icon: Sprout },
  { title: "Where it is", icon: MapPin },
];

/** Three short steps to register a farmer and their first farm, for people the team helps to onboard. */
export default function RegisterFarmerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (farmId: string) => void }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ farmId: string; farmer: string; farm: string; password: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof ReturnType<typeof empty>) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const ha = Number(f.size) > 0 ? (Number(f.size) / 10000).toFixed(2) : null;

  const close = () => {
    onClose();
    window.setTimeout(() => {
      setF(empty());
      setStep(0);
      setDone(null);
      setError(null);
    }, 250);
  };

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (f.firstName.trim().length < 2 || f.lastName.trim().length < 2) return "Enter the farmer's first and last name.";
      if (!f.phone.trim() && !f.email.trim()) return "Add a phone number or an email so the farmer can be reached.";
      if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return "That email does not look right.";
      if (f.password && !PASSWORD_RULE.test(f.password)) return "The password needs 8+ characters with upper and lower case, a number and one of @ $ ! % * ? &.";
    }
    if (s === 1) {
      if (!f.farmName.trim()) return "Give the farm a name.";
      if (f.size && Number(f.size) < 0) return "The size cannot be negative.";
    }
    if (s === 2) {
      if (!f.province || !f.district) return "Choose the province and district.";
      if (!f.sector || !f.cell || !f.village) return "Choose the sector, cell and village from the lists.";
      if ((f.lat && !f.lng) || (!f.lat && f.lng)) return "Give both latitude and longitude, or leave both empty.";
    }
    return null;
  };

  const next = () => {
    const problem = validate(step);
    setError(problem);
    if (!problem) setStep((s) => s + 1);
  };

  const submit = async () => {
    const problem = validate(2);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      const res = await adminService.onboardFarmer({
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        phoneNumber: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        password: f.password || undefined,
        farmName: f.farmName.trim(),
        sizeM2: f.size ? Number(f.size) : undefined,
        soilType: f.soil,
        irrigationMethod: f.irrigation || undefined,
        province: f.province,
        district: f.district,
        sector: f.sector.trim(),
        cell: f.cell.trim(),
        village: f.village.trim(),
        latitude: f.lat ? Number(f.lat) : undefined,
        longitude: f.lng ? Number(f.lng) : undefined,
        farmCode: f.farmCode.trim() || undefined,
      });
      setDone({ farmId: res.farm.id, farmer: `${f.firstName} ${f.lastName}`, farm: res.farm.name, password: f.password, email: f.email.trim() });
      onCreated?.(res.farm.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register the farmer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? "Farmer registered" : "Register a farmer and their farm"}
      subtitle={done ? undefined : "For farmers you are helping to get started. You can add details later."}
      icon={done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Sprout className="h-5 w-5" />}
      width="max-w-2xl"
      footer={
        done ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setDone(null); setF(empty()); setStep(0); }} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Register another</button>
            <button type="button" onClick={close} className="rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3730a3]">Done</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="min-h-[20px] flex-1 text-sm text-red-600">{error}</p>
            {step > 0 && (
              <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }} className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3730a3]">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3730a3] disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Register farmer
              </button>
            )}
          </div>
        )
      }
    >
      {done ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{done.farmer}</span> and the farm <span className="font-semibold text-gray-900">{done.farm}</span> are registered.
          </p>
          {done.password ? (
            <div className="space-y-2 rounded-2xl border bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-3"><span className="text-gray-500">Sign in with</span><span className="font-semibold">{done.email || "their phone number"}</span></div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Temporary password</span>
                <span className="flex items-center gap-2 font-mono font-semibold">
                  {done.password}
                  <button type="button" aria-label="Copy password" onClick={() => navigator.clipboard?.writeText(done.password).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); })} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-[#4338CA]">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </span>
              </div>
              <p className="text-xs text-gray-400">Shown once. Share it with the farmer now.</p>
            </div>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">No password was set, so the farmer cannot sign in yet. Reset their password from the Users page when they are ready.</p>
          )}
          <p className="text-xs text-gray-500">Open the farm from the Farms page to add sensor readings and season records.</p>
        </motion.div>
      ) : (
        <>
          <ol className="mb-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-1 items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#4338CA] text-white ring-4 ring-[#4338CA]/15" : "bg-gray-100 text-gray-400"}`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${i === step ? "text-gray-900" : "text-gray-400"}`}>{s.title}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="space-y-4">
              {step === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name"><TextInput value={f.firstName} onChange={set("firstName")} placeholder="Jean" autoFocus /></Field>
                    <Field label="Last name"><TextInput value={f.lastName} onChange={set("lastName")} placeholder="Habimana" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone" hint="The easiest way to reach most farmers."><TextInput value={f.phone} onChange={set("phone")} placeholder="+250 788 000 000" /></Field>
                    <Field label="Email" optional hint="Leave empty if they have none."><TextInput type="email" value={f.email} onChange={set("email")} placeholder="name@example.com" /></Field>
                  </div>
                  <PasswordField label="Temporary password" value={f.password} onChange={(v) => setF((s) => ({ ...s, password: v }))} hint="Optional. Generate one to hand over, or leave empty and reset it later." />
                </>
              )}
              {step === 1 && (
                <>
                  <Field label="Farm name"><TextInput value={f.farmName} onChange={set("farmName")} placeholder="Habimana maize farm" autoFocus /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Size in square metres" optional hint={ha ? `${Number(f.size).toLocaleString("en-US")} m² is ${ha} ha` : "10,000 m² is 1 hectare"}>
                      <TextInput type="number" min="0" value={f.size} onChange={set("size")} placeholder="5000" />
                    </Field>
                    <Field label="Farm ID" optional hint="For example SAR-006"><TextInput value={f.farmCode} onChange={set("farmCode")} placeholder="SAR-006" /></Field>
                  </div>
                  <Field label="Soil type">
                    <ChipGroup value={f.soil} onChange={(v) => setF((s) => ({ ...s, soil: v }))} options={SOILS.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1), color: soilColor(v) }))} />
                  </Field>
                  <Field label="How is it watered?" optional>
                    <ChipGroup value={f.irrigation} onChange={(v) => setF((s) => ({ ...s, irrigation: s.irrigation === v ? "" : v }))} options={IRRIGATION.map((v) => ({ value: v, label: v }))} />
                  </Field>
                </>
              )}
              {step === 2 && (
                <>
                  <LocationPicker
                    value={{ province: f.province, district: f.district, sector: f.sector, cell: f.cell, village: f.village }}
                    onChange={(place) => setF((s) => ({ ...s, ...place }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Latitude" optional><TextInput type="number" step="any" value={f.lat} onChange={set("lat")} placeholder="-1.2985" /></Field>
                    <Field label="Longitude" optional><TextInput type="number" step="any" value={f.lng} onChange={set("lng")} placeholder="30.3250" /></Field>
                  </div>
                  <p className="rounded-xl bg-gray-50 px-3.5 py-3 text-xs text-gray-500">
                    With a latitude and longitude the farm shows as a dot on the map. Without them it still counts for its district.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </Modal>
  );
}
