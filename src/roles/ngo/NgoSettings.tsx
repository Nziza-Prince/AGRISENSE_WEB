import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { useOrgPortal } from "./useOrgPortal";
import { ApiError, type NgoProfile, type UpdateNgoProfileDto } from "@/api";

const NgoSettings = () => {
  const portal = useOrgPortal();
  const [profile, setProfile] = useState<NgoProfile | null>(null);
  const [form, setForm] = useState<UpdateNgoProfileDto>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Settings | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  useEffect(() => {
    if (!portal.isNgo) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await portal.ngo.getProfile();
        setProfile(res);
        setForm({
          organizationName: res.organizationName || "",
          description: res.description || "",
          registrationNumber: res.registrationNumber || "",
          contactEmail: res.contactEmail || "",
          contactPhone: res.contactPhone || "",
          website: res.website || "",
          focusAreas: res.focusAreas || [],
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load organization profile.");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch profile only when role changes; portal object is recreated each render
  }, [portal.role]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await portal.ngo.updateProfile({
        organizationName: form.organizationName?.trim() || undefined,
        description: form.description?.trim() || undefined,
        registrationNumber: form.registrationNumber?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
        website: form.website?.trim() || undefined,
        focusAreas: form.focusAreas,
      });
      setInfo("Organization profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Organization Settings"
      subtitle="Update organization profile after approval. Pending orgs cannot access farmer data."
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

      {!portal.isNgo ? (
        <Panel>
          <p className="text-sm text-gray-600">
            Government accounts do not use the NGO organization profile endpoint. Use Advisories and
            Regional Intelligence for national planning.
          </p>
        </Panel>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: NGO_ACCENT }} />
        </div>
      ) : (
        <Panel title="Organization profile">
          {profile?.status && (
            <p className="mb-4 text-sm text-gray-500">
              Status: <strong>{profile.status}</strong>
              {profile.assignedRegions?.length
                ? ` · Regions: ${profile.assignedRegions.join(", ")}`
                : ""}
            </p>
          )}
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.organizationName || ""}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              placeholder="Organization name"
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm sm:col-span-2"
            />
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              className="rounded-lg border border-gray-200 p-3 text-sm sm:col-span-2"
            />
            <input
              value={form.registrationNumber || ""}
              onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
              placeholder="Registration number"
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <input
              value={form.website || ""}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="Website"
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <input
              value={form.contactEmail || ""}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="Contact email"
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <input
              value={form.contactPhone || ""}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              placeholder="Contact phone"
              className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
              style={{ backgroundColor: NGO_ACCENT }}
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </Panel>
      )}
    </RoleLayout>
  );
};

export default NgoSettings;
