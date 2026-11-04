import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge, PaginationControls, getPaginationMeta } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, num, useOrgPortal } from "./useOrgPortal";
import { useAuth } from "@/context/useAuth";
import {
  ApiError,
  RWANDA_PROVINCES,
  type OrgFarmSummary,
  type RegionalStatRow,
} from "@/api";

const PAGE_SIZE = 20;

function regionName(row: RegionalStatRow) {
  return row.province || row.region || row.district || row.name || "Unknown";
}

const normalizeProvince = (value: string) => value.trim().toLowerCase().replace(/\s+(province|city)$/, "");

const NgoRegions = () => {
  const portal = useOrgPortal();
  const { user } = useAuth();

  // Only offer the provinces this account is assigned to (all five when none are listed).
  const provinceOptions = useMemo<string[]>(() => {
    const assigned = ((user as { assignedRegions?: string[] } | null)?.assignedRegions ?? []).filter(Boolean);
    const mapped = assigned.map(
      (a) => RWANDA_PROVINCES.find((p) => normalizeProvince(p) === normalizeProvince(a)) ?? a,
    );
    return mapped.length > 0 ? Array.from(new Set<string>(mapped)) : [...RWANDA_PROVINCES];
  }, [user]);

  const [province, setProvince] = useState<string>(provinceOptions[0]);
  const [regional, setRegional] = useState<RegionalStatRow[]>([]);
  const [farms, setFarms] = useState<OrgFarmSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Regional Intelligence | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  useEffect(() => {
    if (!portal.isGovernment) return;
    (async () => {
      setLoading(true);
      try {
        const res = await portal.government.getRegionalStatistics();
        setRegional(extractRows<RegionalStatRow>(res, ["farmsByProvince", "regions", "items", "data"]));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load regional stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, [portal]);

  const loadFarms = async (nextPage = 1, nextProvince = province) => {
    setFarmsLoading(true);
    setError(null);
    try {
      const res = await portal.getFarms(nextPage, PAGE_SIZE, nextProvince);
      const rows = extractRows<OrgFarmSummary>(res, ["farms", "items", "data"]);
      const meta = getPaginationMeta(res, nextPage, PAGE_SIZE, rows.length);
      setFarms(rows);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load farms for province.");
      setFarms([]);
    } finally {
      setFarmsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms(1, province);
  }, [province, portal.role]);

  const cropCounts = useMemo(() => {
    const map = new Map<string, number>();
    farms.forEach((farm) => {
      const crop = String(farm.recommendedCrop || farm.cropType || farm.crop || "No analysis yet");
      map.set(crop, (map.get(crop) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [farms]);

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Regional Agricultural Intelligence"
      subtitle="Select a province to view aggregated farm and crop activity in assigned regions."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {portal.isGovernment && (
        <Panel title="Regional comparison" className="mb-6">
          {loading && regional.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: NGO_ACCENT }} />
            </div>
          ) : regional.length === 0 ? (
            <p className="text-sm text-gray-500">No regional comparison data available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-400">
                    <th className="pb-2">Region</th>
                    <th className="pb-2">Farms</th>
                    <th className="pb-2">Farm area (ha)</th>
                  </tr>
                </thead>
                <tbody>
                  {regional.map((row, idx) => (
                    <tr key={`${regionName(row)}-${idx}`} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-800">{regionName(row)}</td>
                      <td className="py-3">{num(row.count ?? row.farms ?? row.totalFarms).toLocaleString()}</td>
                      <td className="py-3">{num(row.totalSize).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {provinceOptions.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvince(p)}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={
              province === p
                ? { backgroundColor: NGO_ACCENT, color: "#fff", borderColor: NGO_ACCENT }
                : { color: "#4b5563" }
            }
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={`Recommended crops · ${province}`} className="lg:col-span-1">
          {cropCounts.length === 0 ? (
            <p className="text-sm text-gray-500">No crop activity in this page of results.</p>
          ) : (
            <ul className="space-y-2">
              {cropCounts.map(([crop, count]) => (
                <li
                  key={crop}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-800">{crop}</span>
                  <span className="text-gray-500">{count.toLocaleString()} {count === 1 ? "farm" : "farms"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-400">
            Counts the crop most recently recommended for each farm on this page. It shows advice given, not what is planted.
          </p>
        </Panel>

        <Panel title="Farms in region (aggregated)" className="lg:col-span-2">
          {farmsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: NGO_ACCENT }} />
            </div>
          ) : farms.length === 0 ? (
            <p className="text-sm text-gray-500">No farms returned for this province.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-400">
                      <th className="pb-2">Farm</th>
                      <th className="pb-2">District</th>
                      <th className="pb-2">Recommended crop</th>
                      <th className="pb-2">Size (m²)</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farms.map((farm) => (
                      <tr key={farm.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-gray-800">
                          {farm.name || farm.farmName || farm.id}
                        </td>
                        <td className="py-3 text-gray-600">{farm.district || "—"}</td>
                        <td className="py-3">{farm.recommendedCrop || farm.cropType || farm.crop || "—"}</td>
                        <td className="py-3">{farm.sizeHa ?? farm.size ?? "—"}</td>
                        <td className="py-3">
                          <Badge color="green">{farm.status || "Active"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                disabled={farmsLoading}
                onPageChange={(next) => loadFarms(next, province)}
              />
            </>
          )}
        </Panel>
      </div>
    </RoleLayout>
  );
};

export default NgoRegions;
