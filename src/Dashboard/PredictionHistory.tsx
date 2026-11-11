import DashboardLayout from "./DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, predictionService, type PredictionRun, type Recommendation } from "@/api";
import { usePlanEntitlements } from "@/hooks/usePlanEntitlements";
import { PlanFeatureGate } from "@/components/PlanUpgradeBanner";

function getRuns(data: unknown): PredictionRun[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.items ?? record.data ?? record.runs;
  return Array.isArray(items) ? (items as PredictionRun[]) : [];
}

export default function PredictionHistory() {
  const entitlements = usePlanEntitlements();
  const [runs, setRuns] = useState<PredictionRun[]>([]);
  const [selected, setSelected] = useState<PredictionRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Prediction History | AGRISENSE";
  }, []);

  useEffect(() => {
    if (!entitlements.aiRecommendations) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await predictionService.getRuns({ page: 1, limit: 50 });
        if (active) setRuns(getRuns(res));
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load prediction history.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [entitlements.aiRecommendations]);

  const openRun = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await predictionService.getRun(id);
      setSelected(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load prediction details.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (!entitlements.loading && !entitlements.aiRecommendations) {
    return (
      <DashboardLayout>
        <PlanFeatureGate
          planId={entitlements.planId}
          title="Prediction history is a Pro feature"
          description="AI prediction runs and disease recommendations unlock on Pro. Starter includes basic farm records, weather, community, and marketplace browsing."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 p-4 sm:grid-cols-[1.2fr,0.8fr] sm:p-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-[#0B6E4F]">Prediction History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review previous prediction runs and recommendation details.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
            </div>
          ) : runs.length === 0 ? (
            <EmptyState art="pulse" title="Your analyses will appear here" text="Run a soil or crop analysis and every result is kept here." />
          ) : (
            <div className="mt-5 space-y-3">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => openRun(run.id)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-left hover:border-green-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">Run {run.id.slice(0, 8)}</h2>
                      <p className="text-sm text-gray-500">
                        {run.createdAt ? new Date(run.createdAt).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                    <span className="text-sm text-[#2C6E49]">
                      {(run.recommendations || []).length} recommendations
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Run details</h2>
          {detailLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
            </div>
          ) : !selected ? (
            <div className="py-16 text-center text-gray-500">Select a run to view details.</div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Run ID</p>
                <p className="font-semibold text-gray-900">{selected.id}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-semibold text-gray-900">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Recommendations</h3>
                <div className="space-y-2">
                  {((selected.recommendations || []) as Recommendation[]).map((rec) => (
                    <div key={rec.id} className="rounded-xl border border-gray-200 p-3">
                      <p className="font-medium text-[#2C6E49]">
                        {rec.title || rec.type || "Recommendation"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {rec.description || rec.content || "No details provided."}
                      </p>
                    </div>
                  ))}
                  {!selected.recommendations?.length && (
                    <EmptyState art="seedling" title="Advice for this run will appear here" compact />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
