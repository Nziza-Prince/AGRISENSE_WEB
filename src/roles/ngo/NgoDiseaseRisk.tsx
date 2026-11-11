import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { AlertTriangle, Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, useOrgPortal } from "./useOrgPortal";
import { ApiError, type DiseaseTrendItem } from "@/api";

const NgoDiseaseRisk = () => {
  const portal = useOrgPortal();
  const [items, setItems] = useState<DiseaseTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Disease & Risk | ${portal.label} | AGRISENSE`;
  }, [portal.label]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await portal.getDiseaseTrends();
        setItems(extractRows<DiseaseTrendItem>(res, ["trends", "items", "data"]));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load disease trends.");
      } finally {
        setLoading(false);
      }
    })();
  }, [portal]);

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Disease & Crop Risk Monitoring"
      subtitle="Aggregated AI disease intelligence for early warning — not individual farm medical records."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Panel title={`Active signals (${items.length})`}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: NGO_ACCENT }} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState art="pulse" title="Early-warning signals will appear here" text="They show up as soon as farms in your regions report a risk." compact />
        ) : (
          <div className="space-y-3">
            {items.map((d, idx) => (
              <div
                key={String(d.id || idx)}
                className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {d.diseaseName || d.disease || "Disease signal"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Crop: {d.crop || "—"} · Location:{" "}
                        {[d.district, d.province || d.region].filter(Boolean).join(", ") || "—"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Affected farms: {d.affectedFarms ?? "—"}
                        {d.percentage != null ? ` (${d.percentage}%)` : ""}
                      </p>
                      {d.recommendation && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">Recommended intervention: </span>
                          {d.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {d.severity && (
                      <Badge
                        color={
                          String(d.severity).toLowerCase().includes("high")
                            ? "red"
                            : String(d.severity).toLowerCase().includes("medium")
                              ? "amber"
                              : "green"
                        }
                      >
                        {d.severity}
                      </Badge>
                    )}
                    {d.trend && <Badge color="blue">{d.trend}</Badge>}
                    {d.confidence != null && (
                      <Badge color="gray">AI {Math.round(Number(d.confidence) * (Number(d.confidence) <= 1 ? 100 : 1))}%</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default NgoDiseaseRisk;
