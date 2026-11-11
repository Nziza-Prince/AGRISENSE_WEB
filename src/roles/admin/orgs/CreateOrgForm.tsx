import { useState } from "react";
import { X } from "lucide-react";
import { Panel } from "../../ui";
import { adminService, ApiError, type CreateOrgAccountDto } from "@/api";
import { ProvincePicker } from "../StaffAccountsPanel";

const emptyOrgForm = (): CreateOrgAccountDto => ({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  businessName: "",
  organizationName: "",
  autoApprove: true,
});

export default function CreateOrgForm({
  kind,
  onCreated,
  onClose,
}: {
  kind: "supplier" | "ngo";
  onCreated: () => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(emptyOrgForm);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      const dto: CreateOrgAccountDto = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        autoApprove: form.autoApprove,
        ...(kind === "supplier"
          ? { businessName: form.businessName?.trim() || undefined }
          : {
              organizationName: form.organizationName?.trim() || undefined,
              assignedRegions: form.assignedRegions ?? [],
            }),
      };
      if (kind === "supplier") await adminService.createSupplier(dto);
      else await adminService.createNgo(dto);
      setInfo(`${kind === "supplier" ? "Supplier" : "NGO"} created.`);
      setForm(emptyOrgForm());
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={kind === "supplier" ? "Create supplier" : "Create NGO"}
      action={
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          placeholder="First name"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          placeholder="Last name"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
        />
        <input
          value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
          placeholder="Phone (optional)"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        <input
          required
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Temporary password"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
        />
        {kind === "supplier" ? (
          <input
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            placeholder="Business name (optional)"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
          />
        ) : (
          <input
            value={form.organizationName}
            onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
            placeholder="Organization name (optional)"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
          />
        )}
        {kind === "ngo" && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Provinces this NGO works in</p>
            <ProvincePicker
              value={form.assignedRegions ?? []}
              onChange={(assignedRegions) => setForm((f) => ({ ...f, assignedRegions }))}
            />
            <p className="mt-1 text-xs text-gray-500">Without a province the NGO portal stays empty. You can change this later.</p>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={!!form.autoApprove}
            onChange={(e) => setForm((f) => ({ ...f, autoApprove: e.target.checked }))}
          />
          Auto-approve on create
        </label>
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-lg bg-[#4338CA] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Creating…" : `Create ${kind === "supplier" ? "supplier" : "NGO"}`}
        </button>
      </form>
    </Panel>
  );
}

