import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Landmark, Loader2, Store, UserPlus, CheckCircle2, Copy } from "lucide-react";
import { adminService, ApiError, RWANDA_PROVINCES, type CreateOrgAccountDto } from "@/api";
import Modal from "./Modal";
import { Field, PasswordField, TextInput } from "./inputs";
import { PASSWORD_RULE } from "./password";

type Kind = "CFO" | "SUPPLIER" | "NGO";

const KINDS: Array<{ id: Kind; title: string; text: string; icon: typeof Store }> = [
  { id: "CFO", title: "Finance officer", text: "Manages accounts and reports", icon: Landmark },
  { id: "SUPPLIER", title: "Supplier", text: "Sells seeds, fertiliser, tools", icon: Store },
  { id: "NGO", title: "NGO", text: "Supports farmers in provinces", icon: Building2 },
];

const empty = () => ({ firstName: "", lastName: "", email: "", phone: "", password: "", org: "", regions: [] as string[] });

/** Create a finance officer, a supplier or an NGO. Farmers have their own, longer flow. */
export default function AddUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [kind, setKind] = useState<Kind>("CFO");
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof ReturnType<typeof empty>) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const close = () => {
    onClose();
    window.setTimeout(() => {
      setF(empty());
      setDone(null);
      setError(null);
      setKind("CFO");
    }, 250);
  };

  const submit = async () => {
    setError(null);
    if (!f.firstName.trim() || !f.lastName.trim()) return setError("Enter the first and last name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError("Enter a valid email address.");
    if (!PASSWORD_RULE.test(f.password)) return setError("The password needs 8+ characters with upper and lower case, a number and one of @ $ ! % * ? &. Use the wand to generate one.");
    if (kind === "NGO" && f.regions.length === 0) return setError("Choose at least one province, or the NGO will see an empty portal.");
    setBusy(true);
    try {
      const base = { email: f.email.trim(), password: f.password, firstName: f.firstName.trim(), lastName: f.lastName.trim(), phoneNumber: f.phone.trim() || undefined };
      if (kind === "CFO") await adminService.createUser({ ...base, role: "CFO" });
      else {
        const dto: CreateOrgAccountDto = { ...base, autoApprove: true, ...(kind === "SUPPLIER" ? { businessName: f.org.trim() || undefined } : { organizationName: f.org.trim() || undefined, assignedRegions: f.regions }) };
        if (kind === "SUPPLIER") await adminService.createSupplier(dto);
        else await adminService.createNgo(dto);
      }
      setDone({ name: `${base.firstName} ${base.lastName}`, email: base.email, password: f.password });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? "Account created" : "Add a user"}
      subtitle={done ? undefined : "Pick the kind of account, then fill in the details."}
      icon={done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <UserPlus className="h-5 w-5" />}
      width="max-w-lg"
      footer={
        done ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setDone(null); setF(empty()); }} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Add another</button>
            <button type="button" onClick={close} className="rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3730a3]">Done</button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="min-h-[20px] flex-1 text-sm text-red-600">{error}</p>
            <button type="button" onClick={close} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#4338CA] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3730a3] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
            </button>
          </div>
        )
      }
    >
      {done ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{done.name}</span> can now sign in. Share these details with them once; the password is not shown again.
          </p>
          <div className="space-y-2 rounded-2xl border bg-gray-50 p-4 text-sm">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Email</span><span className="font-semibold">{done.email}</span></div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500">Password</span>
              <span className="flex items-center gap-2 font-mono font-semibold">
                {done.password}
                <button type="button" aria-label="Copy password" onClick={() => navigator.clipboard?.writeText(done.password).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); })} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-[#4338CA]">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((k) => {
              const on = kind === k.id;
              return (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`rounded-2xl border p-3 text-left transition ${on ? "border-[#4338CA] bg-indigo-50/60 ring-4 ring-[#4338CA]/10" : "border-gray-200 hover:bg-gray-50"}`}>
                  <k.icon className={`h-5 w-5 ${on ? "text-[#4338CA]" : "text-gray-400"}`} />
                  <span className="mt-2 block text-sm font-semibold text-gray-900">{k.title}</span>
                  <span className="block text-[11px] leading-snug text-gray-500">{k.text}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First name"><TextInput value={f.firstName} onChange={set("firstName")} placeholder="Claudine" /></Field>
            <Field label="Last name"><TextInput value={f.lastName} onChange={set("lastName")} placeholder="Uwase" /></Field>
          </div>
          <Field label="Email"><TextInput type="email" value={f.email} onChange={set("email")} placeholder="name@organisation.rw" /></Field>
          <Field label="Phone" optional><TextInput value={f.phone} onChange={set("phone")} placeholder="+250 788 000 000" /></Field>
          {kind !== "CFO" && (
            <Field label={kind === "SUPPLIER" ? "Business name" : "Organisation name"} optional>
              <TextInput value={f.org} onChange={set("org")} placeholder={kind === "SUPPLIER" ? "Imbuto Nziza Agro-Inputs" : "Ubuhinzi Bwacu Farmers Initiative"} />
            </Field>
          )}
          {kind === "NGO" && (
            <Field label="Provinces it works in">
              <div className="flex flex-wrap gap-2">
                {RWANDA_PROVINCES.map((p) => {
                  const on = f.regions.includes(p);
                  return (
                    <button key={p} type="button" onClick={() => setF((s) => ({ ...s, regions: on ? s.regions.filter((r) => r !== p) : [...s.regions, p] }))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-[#4338CA] bg-indigo-50 text-[#4338CA]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <PasswordField value={f.password} onChange={(v) => setF((s) => ({ ...s, password: v }))} hint="They can change it after the first sign-in." />
        </div>
      )}
    </Modal>
  );
}
