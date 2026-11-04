import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, authService, type OnboardingFarmDto, type SoilType } from "@/api";
import { useAuth } from "@/context/useAuth";
import AuthLayout from "./AuthLayout";
import { Alert, TextField } from "./form-fields";
import {
  sanitizeSingleLine,
  validateName,
  validateNationalId,
  validateRequired,
} from "@/lib/validation";
import { routes } from "@/lib/routes";

const PENDING_IDENTITY_KEY = "agrisense.pending_identity";
const SOIL_TYPES: SoilType[] = ["clay", "sandy", "loamy", "silty", "peaty", "chalky"];

const initialFarm: OnboardingFarmDto = {
  name: "",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  size: 0,
  soilType: "loamy",
};

export default function FarmerOnboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identityDone, setIdentityDone] = useState(false);
  const [farmDone, setFarmDone] = useState(false);
  const [nationalId, setNationalId] = useState("");
  const [farm, setFarm] = useState<OnboardingFarmDto>(initialFarm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Farmer Onboarding | AGRISENSE";
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_IDENTITY_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { nationalId?: string };
        if (parsed.nationalId) setNationalId(parsed.nationalId);
      } catch {
        // ignore bad local state
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await authService.getOnboardingStatus();
        if (!active) return;
        const done =
          typeof status.completed === "boolean"
            ? status.completed
            : Boolean((status as Record<string, unknown>).isComplete);
        const step =
          Number((status as Record<string, unknown>).currentStep) ||
          Number((status as Record<string, unknown>).step) ||
          1;
        setIdentityDone(done || step >= 3);
        setFarmDone(done || Boolean(user?.hasFarm) || step > 3);
      } catch {
        if (!active) return;
        setIdentityDone(false);
        setFarmDone(Boolean(user?.hasFarm));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.hasFarm]);

  const allDone = useMemo(() => identityDone && farmDone, [identityDone, farmDone]);

  useEffect(() => {
    if (allDone) {
      navigate(routes.app.root, { replace: true });
    }
  }, [allDone, navigate]);

  const submitIdentity = async () => {
    const valid = validateNationalId(nationalId);
    if (!valid.valid) {
      setError(valid.message || "National ID is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authService.verifyIdentity({
        nationalId: nationalId.replace(/\s+/g, ""),
        documentType: "NATIONAL_ID",
      });
      sessionStorage.removeItem(PENDING_IDENTITY_KEY);
      setIdentityDone(true);
      setMessage("Identity verified. Continue with your first farm.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to verify identity.");
    } finally {
      setSaving(false);
    }
  };

  const submitFarm = async () => {
    const checks = [
      validateName(farm.name, "Farm name"),
      validateRequired(farm.province, "Province"),
      validateRequired(farm.district, "District"),
      validateRequired(farm.sector, "Sector"),
      validateRequired(farm.cell, "Cell"),
      validateRequired(farm.village, "Village"),
    ];
    const firstError = checks.find((c) => !c.valid);
    if (firstError) {
      setError(firstError.message || "Please complete the farm details.");
      return;
    }
    if (!farm.size || Number(farm.size) <= 0) {
      setError("Farm size must be greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authService.completeOnboardingFarm({
        ...farm,
        name: sanitizeSingleLine(farm.name),
        province: sanitizeSingleLine(farm.province),
        district: sanitizeSingleLine(farm.district),
        sector: sanitizeSingleLine(farm.sector),
        cell: sanitizeSingleLine(farm.cell),
        village: sanitizeSingleLine(farm.village),
        size: Number(farm.size),
      });
      await refreshProfile();
      setFarmDone(true);
      setMessage("Your first farm was added successfully.");
      navigate(routes.app.root, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create farm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout
      title="Complete farmer onboarding"
      subtitle="Finish identity verification and add your first farm before entering the dashboard."
    >
      <div className="space-y-5">
        {loading && <Alert type="success">Checking your onboarding status…</Alert>}
        {error && <Alert type="error">{error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}

        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">Step 2: Identity verification</h3>
            <p className="text-sm text-gray-500">National ID is required for farmer verification.</p>
          </div>
          <div className="space-y-4">
            <TextField
              id="nationalId"
              label="National ID"
              value={nationalId}
              onChange={setNationalId}
              placeholder="1199880012345678"
              inputMode="numeric"
              maxLength={16}
              required
            />
            <button
              type="button"
              onClick={submitIdentity}
              disabled={identityDone || loading || saving}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2C6E49] to-[#0B6E4F] text-base font-bold text-white shadow-lg shadow-green-600/20 disabled:opacity-60"
            >
              {saving && !identityDone ? "Saving..." : identityDone ? "Identity verified" : "Verify identity"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">Step 3: Create your first farm</h3>
            <p className="text-sm text-gray-500">At least one farm is required to complete onboarding.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="farmName"
              label="Farm name"
              value={farm.name}
              onChange={(value) => setFarm((prev) => ({ ...prev, name: value }))}
              placeholder="Green Valley Farm"
              required
            />
            <TextField
              id="farmSize"
              label="Farm size (square metres, m²)"
              type="number"
              value={String(farm.size || "")}
              onChange={(value) =>
                setFarm((prev) => ({ ...prev, size: Number(value) || 0 }))
              }
              placeholder="10"
              required
            />
            <TextField
              id="province"
              label="Province"
              value={farm.province}
              onChange={(value) => setFarm((prev) => ({ ...prev, province: value }))}
              required
            />
            <TextField
              id="district"
              label="District"
              value={farm.district}
              onChange={(value) => setFarm((prev) => ({ ...prev, district: value }))}
              required
            />
            <TextField
              id="sector"
              label="Sector"
              value={farm.sector}
              onChange={(value) => setFarm((prev) => ({ ...prev, sector: value }))}
              required
            />
            <TextField
              id="cell"
              label="Cell"
              value={farm.cell}
              onChange={(value) => setFarm((prev) => ({ ...prev, cell: value }))}
              required
            />
            <TextField
              id="village"
              label="Village"
              value={farm.village}
              onChange={(value) => setFarm((prev) => ({ ...prev, village: value }))}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">Soil type</label>
              <select
                value={farm.soilType}
                onChange={(e) =>
                  setFarm((prev) => ({ ...prev, soilType: e.target.value as SoilType }))
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 outline-none focus:border-[#2C6E49] focus:bg-white focus:ring-2 focus:ring-green-100"
              >
                {SOIL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="latitude"
              label="Latitude (optional)"
              type="number"
              value={farm.latitude?.toString() || ""}
              onChange={(value) =>
                setFarm((prev) => ({
                  ...prev,
                  latitude: value ? Number(value) : undefined,
                }))
              }
            />
            <TextField
              id="longitude"
              label="Longitude (optional)"
              type="number"
              value={farm.longitude?.toString() || ""}
              onChange={(value) =>
                setFarm((prev) => ({
                  ...prev,
                  longitude: value ? Number(value) : undefined,
                }))
              }
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={submitFarm}
              disabled={farmDone || !identityDone || loading || saving}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2C6E49] to-[#0B6E4F] text-base font-bold text-white shadow-lg shadow-green-600/20 disabled:opacity-60"
            >
              {saving && !farmDone ? "Saving..." : farmDone ? "Farm added" : "Create first farm"}
            </button>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
