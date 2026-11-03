import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Panel, Badge } from "../ui";
import {
  adminService,
  ApiError,
  RWANDA_PROVINCES,
  type AdminUserRole,
  type AdminUserSummary,
} from "@/api";
import { getUserDisplayName } from "@/lib/user";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+(province|city)$/, "");

/** Province names saved in older spellings are shown in the standard spelling. */
function standardRegion(value: string): string {
  return RWANDA_PROVINCES.find((p) => normalize(p) === normalize(value)) ?? value;
}

export function ProvincePicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value.map(standardRegion));
  const toggle = (province: string) => {
    const next = new Set(selected);
    if (next.has(province)) next.delete(province);
    else next.add(province);
    onChange([...next]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {RWANDA_PROVINCES.map((p) => (
        <label
          key={p}
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            selected.has(p) ? "border-[#4338CA] bg-indigo-50 text-[#4338CA]" : "border-gray-200 text-gray-600"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={selected.has(p)}
            disabled={disabled}
            onChange={() => toggle(p)}
          />
          {p}
        </label>
      ))}
    </div>
  );
}

const STAFF_ROLES: Array<{ value: AdminUserRole; label: string; help: string }> = [
  { value: "GOVERNMENT", label: "Government officer", help: "Sees farms and trends in the provinces you assign." },
  { value: "CFO", label: "Finance officer (CFO)", help: "Manages accounts, transactions and reports." },
];

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "GOVERNMENT" as AdminUserRole,
  regions: [] as string[],
});

function rowsOf(res: unknown): AdminUserSummary[] {
  const record = (res ?? {}) as Record<string, unknown>;
  const items = record.users ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as AdminUserSummary[]) : [];
}

/**
 * Create government and finance accounts, and choose which provinces NGO and government users cover.
 * Without regions an NGO or government account sees an empty portal, so this lives next to user management.
 */
export default function StaffAccountsPanel({ onChanged }: { onChanged?: () => void }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [orgUsers, setOrgUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadOrgUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [ngos, officers] = await Promise.all([
        adminService.getUsers({ role: "NGO", limit: 100 }),
        adminService.getUsers({ role: "GOVERNMENT", limit: 100 }),
      ]);
      setOrgUsers([...rowsOf(ngos), ...rowsOf(officers)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load NGO and government users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgUsers();
  }, [loadOrgUsers]);

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (form.role === "GOVERNMENT" && form.regions.length === 0) {
      setError("Choose at least one province for a government officer, or their portal will be empty.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phoneNumber: form.phoneNumber.trim() || undefined,
        ...(form.role === "GOVERNMENT" ? { assignedRegions: form.regions } : {}),
      });
      setInfo(`${form.role === "CFO" ? "Finance officer" : "Government officer"} account created.`);
      setForm(emptyForm());
      await loadOrgUsers();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setSaving(false);
    }
  };

  const saveRegions = async (u: AdminUserSummary) => {
    const regions = draft[u.id];
    if (!regions) return;
    setSavingId(u.id);
    setError(null);
    setInfo(null);
    try {
      await adminService.assignRegions(u.id, regions);
      setInfo(`Regions saved for ${getUserDisplayName(u)}.`);
      setDraft((d) => {
        const next = { ...d };
        delete next[u.id];
        return next;
      });
      await loadOrgUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the regions.");
    } finally {
      setSavingId(null);
    }
  };

  const selectedRole = STAFF_ROLES.find((r) => r.value === form.role);

  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-2">
      <Panel title="Create government or finance account">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}
        <form onSubmit={createStaff} className="grid gap-3 sm:grid-cols-2">
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
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminUserRole }))}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {selectedRole && <p className="text-xs text-gray-500 sm:col-span-2">{selectedRole.help}</p>}
          {form.role === "GOVERNMENT" && (
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Provinces this officer covers</p>
              <ProvincePicker value={form.regions} onChange={(regions) => setForm((f) => ({ ...f, regions }))} />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg bg-[#4338CA] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
          >
            {saving ? "Creating…" : "Create account"}
          </button>
        </form>
      </Panel>

      <Panel title="Regions for NGO and government users">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#4338CA]" />
          </div>
        ) : orgUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No NGO or government users yet.</p>
        ) : (
          <div className="space-y-4">
            {orgUsers.map((u) => {
              const current = ((u.assignedRegions as string[] | undefined) ?? []).map(standardRegion);
              const value = draft[u.id] ?? current;
              const changed = draft[u.id] !== undefined;
              return (
                <div key={u.id} className="rounded-xl border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getUserDisplayName(u)}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <Badge color={String(u.role).toUpperCase() === "NGO" ? "purple" : "amber"}>{u.role}</Badge>
                  </div>
                  {current.length === 0 && !changed && (
                    <p className="mb-2 text-xs font-medium text-red-600">
                      No provinces assigned: this account sees an empty portal.
                    </p>
                  )}
                  <ProvincePicker value={value} onChange={(next) => setDraft((d) => ({ ...d, [u.id]: next }))} />
                  {changed && (
                    <button
                      onClick={() => saveRegions(u)}
                      disabled={savingId === u.id}
                      className="mt-3 rounded-lg bg-[#4338CA] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {savingId === u.id ? "Saving…" : "Save regions"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
