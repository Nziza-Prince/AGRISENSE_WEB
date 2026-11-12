import DashboardLayout from "./DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, Leaf, Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  farmService,
  predictionService,
  type DashboardData,
  type FarmCrop,
  type PredictionRun,
} from "@/api"
import { useAuth } from "@/context/useAuth"
import { useFarms } from "@/hooks/useFarms"
import { useWeather } from "@/hooks/useWeather"
import WeatherIcon from "@/components/WeatherIcon"
import { farmPlaceCandidates, formatFarmPlace } from "@/lib/weather"
import { getUserDisplayName } from "@/lib/user"
import { usePlanEntitlements } from "@/hooks/usePlanEntitlements"
import { planDisplayName } from "@/lib/planEntitlements"
import { PlanUpgradeBanner } from "@/components/PlanUpgradeBanner"
import { Link } from "react-router-dom"
import { routes } from "@/lib/routes"

const PIE_COLORS = ["#4D8D6E", "#2D6A4F", "#B5D9C3", "#95D5B2", "#40916C", "#74C69D", "#1B4332"]

interface StatCard {
  title: string
  metrics: string
  percentage: string
}

interface PieSlice {
  name: string
  value: number
  color: string
}

interface MonthPoint {
  month: string
  [key: string]: string | number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function monthLabel(date: Date) {
  return date.toLocaleString("en", { month: "short" }).toUpperCase()
}

function lastNMonths(n: number): MonthPoint[] {
  const now = new Date()
  const points: MonthPoint[] = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    points.push({ month: monthLabel(d), key: `${d.getFullYear()}-${d.getMonth()}` })
  }
  return points
}

function normalizeCrops(payload: unknown): FarmCrop[] {
  if (Array.isArray(payload)) return payload as FarmCrop[]
  const record = asRecord(payload)
  if (!record) return []
  const rows = record.crops ?? record.items ?? record.data
  return Array.isArray(rows) ? (rows as FarmCrop[]) : []
}

function pieFromCrops(crops: FarmCrop[]): PieSlice[] {
  const counts: Record<string, number> = {}
  crops.forEach((crop) => {
    const name = (crop.cropType || "Unknown").toString()
    const weight = toNumber(crop.areaPlanted) ?? 1
    counts[name] = (counts[name] || 0) + weight
  })
  return Object.entries(counts).map(([name, value], index) => ({
    name,
    value: Math.round(value * 10) / 10,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }))
}

function pieFromSoilComposition(soil: Record<string, unknown> | null | undefined): PieSlice[] {
  if (!soil) return []
  const slices: PieSlice[] = []
  Object.entries(soil).forEach(([key, raw], index) => {
    const value = toNumber(raw)
    if (value == null || value <= 0) return
    slices.push({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: PIE_COLORS[index % PIE_COLORS.length],
    })
  })
  return slices
}

function pieFromFarmSoil(farms: { soilType?: string }[]): PieSlice[] {
  const counts: Record<string, number> = {}
  farms.forEach((farm) => {
    const key = (farm.soilType || "Unknown").toString()
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts).map(([name, value], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }))
}

function parseTrendSeries(trends: unknown): { data: MonthPoint[]; keys: string[] } | null {
  if (!Array.isArray(trends) || trends.length === 0) return null

  const rows = trends.map((item) => asRecord(item)).filter(Boolean) as Record<string, unknown>[]
  if (!rows.length) return null

  const reserved = new Set(["month", "label", "date", "name", "period", "key"])
  const numericKeys = new Set<string>()
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (!reserved.has(key.toLowerCase()) && toNumber(value) != null) numericKeys.add(key)
    })
  })

  const keys = [...numericKeys].slice(0, 3)
  if (!keys.length) return null

  const data = rows.map((row, index) => {
    const label =
      (typeof row.month === "string" && row.month) ||
      (typeof row.label === "string" && row.label) ||
      (typeof row.period === "string" && row.period) ||
      (typeof row.name === "string" && row.name) ||
      (typeof row.date === "string"
        ? monthLabel(new Date(row.date))
        : `P${index + 1}`)

    const point: MonthPoint = { month: String(label).toUpperCase().slice(0, 3) }
    keys.forEach((key) => {
      point[key] = toNumber(row[key]) ?? 0
    })
    return point
  })

  return { data, keys }
}

function activityFromRuns(
  runs: PredictionRun[],
  suggestionsCount: number,
): { data: MonthPoint[]; keys: string[] } {
  const months = lastNMonths(6)
  const runCounts = new Map<string, number>()
  const recCounts = new Map<string, number>()

  runs.forEach((run) => {
    if (!run.createdAt) return
    const d = new Date(run.createdAt)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${d.getMonth()}`
    runCounts.set(key, (runCounts.get(key) || 0) + 1)
    const recs = Array.isArray(run.recommendations) ? run.recommendations.length : 0
    recCounts.set(key, (recCounts.get(key) || 0) + recs)
  })

  // Spread total suggestions across months with runs when per-run recs are missing.
  const monthsWithRuns = months.filter((m) => (runCounts.get(String(m.key)) || 0) > 0)
  const fallbackPerMonth =
    monthsWithRuns.length > 0 ? Math.round(suggestionsCount / monthsWithRuns.length) : 0

  const data = months.map((m) => {
    const key = String(m.key)
    const predictions = runCounts.get(key) || 0
    const fromRuns = recCounts.get(key) || 0
    return {
      month: m.month,
      predictions,
      recommendations: fromRuns > 0 ? fromRuns : predictions > 0 ? fallbackPerMonth : 0,
    }
  })

  return { data, keys: ["predictions", "recommendations"] }
}

function growthFromRuns(runs: PredictionRun[]): { data: MonthPoint[]; keys: string[] } {
  const months = lastNMonths(12)
  const counts = new Map<string, number>()
  runs.forEach((run) => {
    if (!run.createdAt) return
    const d = new Date(run.createdAt)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${d.getMonth()}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  const data = months.map((m) => ({
    month: m.month,
    runs: counts.get(String(m.key)) || 0,
  }))
  return { data, keys: ["runs"] }
}

const SERIES_COLORS = ["#4D8D6E", "#111827", "#40916C"]

/** A flat grey ring drawn before there is any data, so the chart is not a blank box. */
const GHOST_RING = [{ name: "", value: 1, color: "#E5E7EB" }]

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { farms, loading: farmsLoading } = useFarms()
  const entitlements = usePlanEntitlements()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [crops, setCrops] = useState<FarmCrop[]>([])
  const [loadingExtra, setLoadingExtra] = useState(true)
  const displayName = getUserDisplayName(user)

  const firstFarm = farms[0]
  const weatherPlace = firstFarm ? formatFarmPlace(firstFarm) : undefined
  const { weather } = useWeather({
    place: weatherPlace,
    placeCandidates: firstFarm ? farmPlaceCandidates(firstFarm) : undefined,
    useGeolocation: true,
    preferDevice: !weatherPlace,
  })

  useEffect(() => {
    document.title = "Dashboard | AGRISENSE"
  }, [])

  useEffect(() => {
    let active = true
    predictionService
      .getDashboard({ limit: 50 })
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch(() => {
        // Dashboard payload is optional; charts fall back to farms/crops.
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!farms.length) {
      setCrops([])
      setLoadingExtra(false)
      return
    }

    setLoadingExtra(true)
    Promise.allSettled(farms.map((farm) => farmService.getCrops(farm.id)))
      .then((results) => {
        if (!active) return
        const all: FarmCrop[] = []
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            all.push(...normalizeCrops(result.value))
          }
        })
        setCrops(all)
      })
      .finally(() => {
        if (active) setLoadingExtra(false)
      })

    return () => {
      active = false
    }
  }, [farms])

  const totalAcreage = farms.reduce((sum, f) => sum + (Number(f.size) || 0), 0)
  const runs: PredictionRun[] = useMemo(() => {
    if (Array.isArray(dashboard?.runs)) return dashboard.runs
    if (Array.isArray(dashboard?.history)) {
      return dashboard.history
        .map((item) => asRecord(item))
        .filter(Boolean) as PredictionRun[]
    }
    return []
  }, [dashboard])

  const suggestionsCount = Array.isArray(dashboard?.suggestions)
    ? dashboard!.suggestions!.length
    : 0

  const harvestData = useMemo(() => {
    const fromCrops = pieFromCrops(crops)
    if (fromCrops.length) return { data: fromCrops, title: "Crop Plantings" }
    const fromSoil = pieFromSoilComposition(asRecord(dashboard?.soilComposition))
    if (fromSoil.length) return { data: fromSoil, title: "Soil Composition" }
    const fromFarms = pieFromFarmSoil(farms)
    if (fromFarms.length) return { data: fromFarms, title: "Farms by Soil Type" }
    return { data: [] as PieSlice[], title: "Crop Harvest Summary" }
  }, [crops, dashboard, farms])

  const growthSeries = useMemo(() => {
    const fromTrends = parseTrendSeries(dashboard?.trends)
    if (fromTrends) return fromTrends
    return growthFromRuns(runs)
  }, [dashboard, runs])

  const activitySeries = useMemo(
    () => activityFromRuns(runs, suggestionsCount),
    [runs, suggestionsCount],
  )

  const cards: StatCard[] = [
    { title: "Total Farms", metrics: `${farms.length}`, percentage: "active" },
    {
      title: "Total area",
      metrics: `${Math.round(totalAcreage).toLocaleString()} m²`,
      percentage: "tracked",
    },
    { title: "Prediction Runs", metrics: `${runs.length}`, percentage: "recorded" },
    {
      title: "Recommendations",
      metrics: `${suggestionsCount}`,
      percentage: "available",
    },
  ]

  const loading = farmsLoading || loadingExtra

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 bg-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B6E4F]">
              Welcome back{displayName !== "Guest" ? `, ${displayName}` : ""}!
            </h1>
            <p className="text-gray-500 text-sm">
              Here is an overview of your farms ·{" "}
              <Link to={routes.app.subscription} className="font-semibold text-[#2C6E49] hover:underline">
                {planDisplayName(entitlements.planId)} plan
              </Link>
            </p>
          </div>

          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-white rounded-lg shadow-sm p-3 flex items-center border">
              {weather ? (
                <>
                  <WeatherIcon
                    category={weather.current.category}
                    className="h-5 w-5 mr-2 text-[#377552] shrink-0"
                  />
                  <span className="font-semibold">
                    {Math.round(weather.current.temperature)}°C
                  </span>
                  <span className="text-gray-500 ml-2 text-sm truncate">
                    - {weather.current.label}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Loading weather…</span>
              )}
            </div>
            <Button
              onClick={() => navigate("/app/crop-care")}
              className="px-6 font-bold bg-[#377552] hover:bg-[#2D6A4F] shrink-0"
            >
              Explore more
            </Button>
          </div>
        </div>

        {!entitlements.isPaid && (
          <div className="mb-6">
            <PlanUpgradeBanner
              title="You're on Starter"
              description={`Includes ${entitlements.maxFarms ?? 1} farm, ${entitlements.weatherDays}-day weather, community, and marketplace browsing. Upgrade for AI tips, analytics, and more farms.`}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full lg:w-1/2 mt-12">
            {cards.map((card) => (
              <Card key={card.title} className="border shadow-sm h-[130px]">
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                      <p className="text-lg font-bold">{card.metrics}</p>
                      <p className="text-[#377552] text-sm mt-1">
                        <ArrowUp className="inline h-3 w-3 mr-1" />
                        {card.percentage}
                      </p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-md">
                      <Leaf className="h-4 w-4 text-[#377552]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border shadow-sm lg:w-1/2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{harvestData.title}</h2>
              </div>

              {loading ? (
                <div className="flex h-[250px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#2C6E49]" />
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={harvestData.data.length ? harvestData.data : GHOST_RING}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(harvestData.data.length ? harvestData.data : GHOST_RING).map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      {harvestData.data.length > 0 && (
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          wrapperStyle={{ paddingLeft: "20px" }}
                        />
                      )}
                      {harvestData.data.length > 0 && <Tooltip />}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6 mx-4 sm:mx-5 bg-white">
        <Card className="border shadow-sm lg:w-1/2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Crop Growth Monitoring</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {growthSeries.keys.map((key, index) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 capitalize">{key}</span>
                </div>
              ))}
            </div>

            {(
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthSeries.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    {growthSeries.keys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm lg:w-1/2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activities</h2>
              <div className="flex items-center gap-4">
                {activitySeries.keys.map((key, index) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {(
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activitySeries.data}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="predictionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4D8D6E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4D8D6E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="predictions"
                      stroke="#4D8D6E"
                      strokeWidth={2}
                      fill="url(#predictionsGradient)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recommendations"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
