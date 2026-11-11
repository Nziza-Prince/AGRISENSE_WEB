import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, PaginationControls, getPaginationMeta } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, useOrgPortal } from "./useOrgPortal";
import { ApiError, type OrgFarmerSummary } from "@/api";
import { getUserDisplayName } from "@/lib/user";

const PAGE_SIZE = 20;

const NgoFarmers = () => {
  const portal = useOrgPortal();
  const [farmers, setFarmers] = useState<OrgFarmerSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Farmers | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  const load = async (nextPage = 1) => {
    if (!portal.isNgo) {
      setLoading(false);
      setFarmers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portal.ngo.getFarmers(nextPage, PAGE_SIZE);
      const rows = extractRows<OrgFarmerSummary>(res, ["farmers", "items", "data"]);
      const meta = getPaginationMeta(res, nextPage, PAGE_SIZE, rows.length);
      setFarmers(rows);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load farmers. Unapproved organizations cannot access farmer data.",
      );
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when role changes; load is recreated each render
  }, [portal.role]);

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Authorized Farmers"
      subtitle="Only organization-authorized farmer summaries in assigned regions — no national IDs or private credentials."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!portal.isNgo && (
        <Panel className="mb-6">
          <p className="text-sm text-gray-600">
            Farmer listing is served by the NGO farmers API. Government users should use Regional
            Intelligence for aggregated farm activity by province.
          </p>
        </Panel>
      )}

      <Panel title={`Farmers (${total || farmers.length})`}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: NGO_ACCENT }} />
          </div>
        ) : farmers.length === 0 ? (
          <EmptyState art="people" title="Farmers will appear here" text="Farmers in your regions who allow sharing show up in this list." compact />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-400">
                    <th className="pb-2">Farmer</th>
                    <th className="pb-2">Province</th>
                    <th className="pb-2">District</th>
                    <th className="pb-2">Farms</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-800">
                        {getUserDisplayName(farmer)}
                      </td>
                      <td className="py-3 text-gray-600">{farmer.province || "—"}</td>
                      <td className="py-3 text-gray-600">{farmer.district || "—"}</td>
                      <td className="py-3">{farmer.farmsCount ?? "—"}</td>
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
              disabled={loading}
              onPageChange={load}
            />
          </>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default NgoFarmers;
