import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, X } from "lucide-react";
import { Panel } from "../ui";
import {
  adminService,
  ApiError,
  RWANDA_PROVINCES,
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

function rowsOf(res: unknown): AdminUserSummary[] {
  const record = (res ?? {}) as Record<string, unknown>;
  const items = record.users ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as AdminUserSummary[]) : [];
}

/** Choose which provinces each NGO covers. Without regions an NGO sees an empty portal. */
export default function StaffAccountsPanel({ onChanged, onClose }: { onChanged?: () => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadOrgUsers = useCallback(async () => {
    setLoading(true);
    try {
      setOrgUsers(rowsOf(await adminService.getUsers({ role: "NGO", limit: 100 })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the NGOs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgUsers();
  }, [loadOrgUsers]);

  const saveRegions = async (u: AdminUserSummary) => {
    const regions = draft[u.id];
    if (!regions) return;
    setSavingId(u.id);
    setError(null);
    setInfo(null);
    try {
      await adminService.assignRegions(u.id, regions);
      setInfo(`Provinces saved for ${getUserDisplayName(u)}.`);
      setDraft((d) => {
        const next = { ...d };
        delete next[u.id];
        return next;
      });
      await loadOrgUsers();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the provinces.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mb-6">
      <Panel
        title="Provinces for NGOs"
        action={
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        }
      >
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#4338CA]" />
          </div>
        ) : orgUsers.length === 0 ? (
          <EmptyState art="people" title="NGO accounts will appear here" text="Create one above and assign the provinces it covers." compact />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {orgUsers.map((u) => {
              const current = ((u.assignedRegions as string[] | undefined) ?? []).map(standardRegion);
              const value = draft[u.id] ?? current;
              const changed = draft[u.id] !== undefined;
              return (
                <div key={u.id} className="rounded-xl border p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-900">{getUserDisplayName(u)}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  {current.length === 0 && !changed && <p className="mb-2 text-xs font-medium text-red-600">No provinces assigned: this NGO sees an empty portal.</p>}
                  <ProvincePicker value={value} onChange={(next) => setDraft((d) => ({ ...d, [u.id]: next }))} />
                  {changed && (
                    <button onClick={() => saveRegions(u)} disabled={savingId === u.id} className="mt-3 rounded-lg bg-[#4338CA] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                      {savingId === u.id ? "Saving…" : "Save provinces"}
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
