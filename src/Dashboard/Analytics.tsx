import DashboardLayout from "./DashboardLayout"
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Leaf, Sprout, Ruler, Users, Loader2 } from 'lucide-react';
import {
  communityService,
  predictionService,
  type CommunityPost,
  type Recommendation,
} from '@/api';
import { useFarms } from '@/hooks/useFarms';
import { usePlanEntitlements } from '@/hooks/usePlanEntitlements';
import { PlanFeatureGate } from '@/components/PlanUpgradeBanner';

const COLORS = ['#2D6A4F', '#4D8D6E', '#95D5B2', '#B7E4C7', '#40916C', '#74C69D'];

const Analytics = () => {
  const { farms } = useFarms();
  const entitlements = usePlanEntitlements();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Analytics | AGRISENSE';
  }, []);

  useEffect(() => {
    if (!entitlements.features.has('analytics')) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.allSettled([
      predictionService.getRecommendations({ limit: 100 }),
      communityService.getPosts(),
    ]).then(([recRes, postRes]) => {
      if (!active) return;
      if (recRes.status === 'fulfilled') {
        const r = recRes.value;
        const list = (r.data || r.items || (Array.isArray(r) ? r : [])) as Recommendation[];
        setRecommendations(Array.isArray(list) ? list : []);
      }
      if (postRes.status === 'fulfilled') {
        setPosts(Array.isArray(postRes.value) ? postRes.value : []);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [entitlements.features]);

  const totalAcreage = farms.reduce((s, f) => s + (Number(f.size) || 0), 0);

  const soilData = useMemo(() => {
    const counts: Record<string, number> = {};
    farms.forEach((f) => {
      const key = (f.soilType || 'unknown').toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [farms]);

  const recByType = useMemo(() => {
    const counts: Record<string, number> = {};
    recommendations.forEach((r) => {
      const key = (r.type || 'general').toString();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [recommendations]);

  // Gate after all hooks so the hook order never changes between renders.
  if (!entitlements.loading && !entitlements.features.has('analytics')) {
    return (
      <DashboardLayout>
        <PlanFeatureGate
          planId={entitlements.planId}
          title="Analytics is a Pro feature"
          description="Deeper farm analytics, recommendation charts, and insight dashboards unlock on Pro."
        />
      </DashboardLayout>
    );
  }

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);

  const stats = [
    { label: 'Total Farms', value: farms.length, icon: Leaf },
    { label: 'Total area (m²)', value: `${Math.round(totalAcreage).toLocaleString()}`, icon: Ruler },
    { label: 'Recommendations', value: recommendations.length, icon: Sprout },
    { label: 'Community Posts', value: posts.length, icon: Users },
  ];

  return (
    <DashboardLayout>

        <div className="p-4 sm:p-6 space-y-6">
          <h1 className="text-2xl font-bold text-[#0B6E4F]">Analytics</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="border shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">{label}</p>
                        <p className="text-2xl font-bold text-gray-800">{value}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Icon className="h-5 w-5 text-[#377552]" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Soil type distribution */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Farms by Soil Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {soilData.length === 0 ? (
                      <EmptyState text="No farms yet. Add farms in Settings." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={soilData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={95}
                              paddingAngle={2}
                              dataKey="value"
                              label={(entry) => `${entry.name} (${entry.value})`}
                            >
                              {soilData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations by type */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recommendations by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recByType.length === 0 ? (
                      <EmptyState text="No recommendations yet. Run a soil analysis." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={recByType}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {recByType.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Community engagement */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Community Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <Metric label="Posts" value={posts.length} />
                    <Metric label="Likes" value={totalLikes} />
                    <Metric label="Comments" value={totalComments} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
  );
};

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-green-50 py-6">
      <p className="text-3xl font-bold text-[#2D6A4F]">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 text-center px-6">
      {text}
    </div>
  );
}

export default Analytics;
