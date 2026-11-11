import { useEffect, useState } from "react";
import { Loader2, Megaphone, Plus, X } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, useOrgPortal } from "./useOrgPortal";
import {
  ApiError,
  RWANDA_PROVINCES,
  type CreateAdvisoryDto,
  type GovernmentAdvisory,
} from "@/api";

const ADVISORY_TYPES: CreateAdvisoryDto["type"][] = [
  "GENERAL",
  "WEATHER",
  "DISEASE",
  "EMERGENCY",
  "FOOD_SECURITY",
];

const emptyForm = (): CreateAdvisoryDto => ({
  title: "",
  content: "",
  type: "GENERAL",
  targetRegions: [],
});

const NgoAdvisories = () => {
  const portal = useOrgPortal();
  const [items, setItems] = useState<GovernmentAdvisory[]>([]);
  const [regionsFilter, setRegionsFilter] = useState(RWANDA_PROVINCES.join(","));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `Advisories | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  const load = async () => {
    if (!portal.isGovernment) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portal.government.getAdvisories(regionsFilter || RWANDA_PROVINCES[0]);
      setItems(extractRows<GovernmentAdvisory>(res, ["advisories", "items", "data"]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load advisories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when role/filter changes; load is recreated each render
  }, [portal.role, regionsFilter]);

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
      await portal.government.createAdvisory({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        targetRegions: form.targetRegions?.length ? form.targetRegions : undefined,
      });
      setInfo("Advisory published.");
      setForm(emptyForm());
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to publish advisory.");
    } finally {
      setSaving(false);
    }
  };

  const sendNgoNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await portal.ngo.sendNotification({
        title: form.title.trim(),
        message: form.content.trim(),
        targetRegions: form.targetRegions,
      });
      setInfo("Notification request sent.");
      setForm(emptyForm());
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send notification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Early-Warning Advisories"
      subtitle="Publish regional alerts for weather, disease, and food-security risks."
      actions={
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: NGO_ACCENT }}
        >
          <Plus className="h-4 w-4" />
          {portal.isGovernment ? "New advisory" : "Notify farmers"}
        </button>
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

      {open && (
        <Panel
          title={portal.isGovernment ? "Publish advisory" : "Send regional notification"}
          className="mb-6"
        >
          <form
            onSubmit={portal.isGovernment ? create : sendNgoNotice}
            className="space-y-3"
          >
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Message content"
              rows={4}
              className="w-full rounded-lg border border-gray-200 p-3 text-sm"
            />
            {portal.isGovernment && (
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as CreateAdvisoryDto["type"],
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
              >
                {ADVISORY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
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
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: NGO_ACCENT }}
              >
                {saving ? "Sending…" : portal.isGovernment ? "Publish" : "Send"}
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

      {portal.isGovernment ? (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-400">
              Filter regions (comma-separated)
            </label>
            <input
              value={regionsFilter}
              onChange={(e) => setRegionsFilter(e.target.value)}
              className="h-10 w-full max-w-xl rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>
          <Panel title={`Advisories (${items.length})`}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin" style={{ color: NGO_ACCENT }} />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">No advisories found for these regions.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-600">{item.content}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            {(item.targetRegions || []).join(", ") || "National"}
                            {item.createdAt
                              ? ` · ${new Date(item.createdAt).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <Badge color={item.isPublished === false ? "gray" : "green"}>
                        {item.type || "GENERAL"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      ) : (
        <Panel>
          <p className="text-sm text-gray-600">
            NGO accounts can send targeted farmer notifications via the button above. Government
            advisories (weather / disease / emergency) appear when signed in as a government user.
          </p>
        </Panel>
      )}
    </RoleLayout>
  );
};

export default NgoAdvisories;
