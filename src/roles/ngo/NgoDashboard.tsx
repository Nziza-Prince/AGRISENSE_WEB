import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import {
  Users,
  MapPinned,
  HeartHandshake,
  AlertTriangle,
  Loader2,
  Sprout,
} from "lucide-react";
import RoleLayout from "../RoleLayout";
import { StatCard, Panel, Badge } from "../ui";
import { NGO_ACCENT, ngoLinks } from "./config";
import { extractRows, num, useOrgPortal } from "./useOrgPortal";
import {
  ApiError,
  type DiseaseTrendItem,
  type NgoProgram,
  type OrgStatistics,
} from "@/api";

function programTitle(p: NgoProgram) {
  return p.title || p.name || "Untitled program";
}

const NgoDashboard = () => {
  const portal = useOrgPortal();
  const [stats, setStats] = useState<OrgStatistics | null>(null);
  const [programs, setPrograms] = useState<NgoProgram[]>([]);
  const [diseases, setDiseases] = useState<DiseaseTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${portal.label} Dashboard | AGRISENSE`;
  }, [portal.label]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, diseaseRes, programsRes] = await Promise.all([
          portal.getStatistics().catch(() => null),
          portal.getDiseaseTrends().catch(() => null),
          portal.isNgo
            ? portal.ngo.getPrograms().catch(() => null)
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setStats(statsRes);
        setDiseases(extractRows<DiseaseTrendItem>(diseaseRes, ["trends", "items", "data"]));
        setPrograms(extractRows<NgoProgram>(programsRes, ["programs", "items", "data"]));
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [portal]);

  const activePrograms = programs.filter((p) => p.isActive !== false).length;

  return (
    <RoleLayout
      links={ngoLinks}
      roleLabel={portal.roleLabel}
      accent={NGO_ACCENT}
      title="Regional Intelligence Overview"
      subtitle="Aggregated farm insights for planning interventions — not private farmer records."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: NGO_ACCENT }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Farmers (aggregated)"
              value={num(stats?.totalFarmers).toLocaleString()}
              accent={NGO_ACCENT}
            />
            <StatCard
              icon={Sprout}
              label="Active farms"
              value={num(stats?.activeFarms ?? stats?.totalFarms).toLocaleString()}
              accent={NGO_ACCENT}
            />
            <StatCard
              icon={MapPinned}
              label="Regions covered"
              value={num(stats?.regionsCovered ?? stats?.assignedRegions?.length)}
              accent={NGO_ACCENT}
            />
            <StatCard
              icon={HeartHandshake}
              label="Active programs"
              value={stats?.activePrograms ?? activePrograms}
              accent={NGO_ACCENT}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Disease & early-warning signals">
              {diseases.length === 0 ? (
                <EmptyState art="pulse" title="Early-warning signals will appear here" text="They show up as soon as farms in your regions report a risk." compact />
              ) : (
                <ul className="space-y-3">
                  {diseases.slice(0, 6).map((d, idx) => (
                    <li
                      key={String(d.id || idx)}
                      className="rounded-lg border border-amber-100 bg-amber-50/60 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {d.diseaseName || d.disease || "Disease alert"}
                            {d.crop ? ` · ${d.crop}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            {[d.district, d.province || d.region].filter(Boolean).join(", ") ||
                              "Assigned region"}
                            {d.affectedFarms != null
                              ? ` · ${d.affectedFarms} farms affected`
                              : ""}
                            {d.percentage != null ? ` · ${d.percentage}%` : ""}
                          </p>
                          {d.recommendation && (
                            <p className="mt-1 text-xs text-gray-500">{d.recommendation}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Programs snapshot">
              {programs.length === 0 ? (
                <EmptyState
                  art="seedling"
                  title="Your programs will appear here"
                  text={
                    portal.isGovernment
                      ? "Use Advisories to send national alerts."
                      : "Create one to target crops and regions with support."
                  }
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {programs.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{programTitle(p)}</p>
                        <p className="text-xs text-gray-500">
                          {(p.targetRegions || []).join(", ") || "Regions TBD"}
                        </p>
                      </div>
                      <Badge color={p.isActive === false ? "gray" : "green"}>
                        {p.isActive === false ? "Inactive" : p.status || "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Privacy reminder" className="mt-6">
            <p className="text-sm text-gray-600">
              This portal shows <strong>aggregated regional agricultural intelligence</strong> for
              planning interventions. National IDs, passwords, private contacts, and unrelated
              personal farmer data are not exposed here.
            </p>
          </Panel>
        </>
      )}
    </RoleLayout>
  );
};

export default NgoDashboard;
