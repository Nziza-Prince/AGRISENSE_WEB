import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Plus, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, useOrgPortal } from "./useOrgPortal";
import {
  ApiError,
  RWANDA_PROVINCES,
  type CreateProgramDto,
  type NgoProgram,
} from "@/api";

function programTitle(p: NgoProgram) {
  return p.title || p.name || "Untitled program";
}

const emptyForm = (): CreateProgramDto => ({
  title: "",
  description: "",
  targetRegions: [],
  budget: "",
  startDate: "",
  endDate: "",
});

const NgoPrograms = () => {
  const portal = useOrgPortal();
  const [programs, setPrograms] = useState<NgoProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `Programs | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  const load = async () => {
    if (!portal.isNgo) {
      setLoading(false);
      setPrograms([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portal.ngo.getPrograms();
      setPrograms(extractRows<NgoProgram>(res, ["programs", "items", "data"]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load programs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when role changes; load is recreated each render
  }, [portal.role]);

  const toggleRegion = (region: string) => {
    setForm((prev) => {
      const current = prev.targetRegions || [];
      return {
        ...prev,
        targetRegions: current.includes(region)
          ? current.filter((r) => r !== region)
          : [...current, region],
      };
    });
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await portal.ngo.createProgram({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        targetRegions: form.targetRegions?.length ? form.targetRegions : undefined,
        budget: form.budget?.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setInfo("Program created.");
      setForm(emptyForm());
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create program.");
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id: string, isActive: boolean) => {
    try {
      await portal.ngo.updateProgram(id, { isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update program.");
    }
  };

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Agricultural Programs & Interventions"
      subtitle="Create seed, fertilizer, training, and disease-control programs for assigned regions."
      actions={
        portal.isNgo ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: NGO_ACCENT }}
          >
            <Plus className="h-4 w-4" /> New Program
          </button>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {info}
        </div>
      )}

      {!portal.isNgo && (
        <Panel className="mb-6">
          <p className="text-sm text-gray-600">
            Government accounts use <strong>Advisories</strong> for national alerts. Program CRUD
            is provided by the NGO programs API — sign in as an approved NGO organization to manage
            interventions.
          </p>
        </Panel>
      )}

      {open && (
        <Panel title="Create intervention program" className="mb-6">
          <form onSubmit={create} className="space-y-3">
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Program title (e.g. Potato Disease Control)"
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description, treatment approach, and goals"
              rows={3}
              className="w-full rounded-lg border border-gray-200 p-3 text-sm"
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Target regions</p>
              <div className="flex flex-wrap gap-2">
                {RWANDA_PROVINCES.map((region) => {
                  const selected = form.targetRegions?.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={
                        selected
                          ? { backgroundColor: NGO_ACCENT, color: "#fff", borderColor: NGO_ACCENT }
                          : undefined
                      }
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="Budget"
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
              />
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: NGO_ACCENT }}
              >
                {saving ? "Saving…" : "Create program"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: NGO_ACCENT }} />
        </div>
      ) : programs.length === 0 ? (
        <Panel>
          <EmptyState art="seedling" title="Your programs will appear here" text="Create one to target crops and regions with support." compact />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => (
            <Panel key={p.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{programTitle(p)}</h3>
                <Badge color={p.isActive === false ? "gray" : "green"}>
                  {p.isActive === false ? "Inactive" : p.status || "Active"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {(p.targetRegions || []).join(", ") || "No regions set"}
              </p>
              {p.description && (
                <p className="mt-3 line-clamp-3 text-sm text-gray-600">{p.description}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="font-semibold text-gray-800">{p.budget || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Dates</p>
                  <p className="font-semibold text-gray-800">
                    {[p.startDate, p.endDate].filter(Boolean).join(" → ") || "—"}
                  </p>
                </div>
              </div>
              {portal.isNgo && (
                <button
                  type="button"
                  onClick={() => setActive(p.id, p.isActive === false)}
                  className="mt-4 text-xs font-semibold"
                  style={{ color: NGO_ACCENT }}
                >
                  {p.isActive === false ? "Reactivate" : "Mark inactive"}
                </button>
              )}
            </Panel>
          ))}
        </div>
      )}
    </RoleLayout>
  );
};

export default NgoPrograms;
