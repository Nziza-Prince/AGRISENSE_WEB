import DashboardLayout from "../DashboardLayout"
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useMemo, useState } from "react"
import { YieldChart } from "./yield-chart"
import { TemperatureGauge } from "./temperature-gauge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { predictionService, type Recommendation } from "@/api"
import { useFarms } from "@/hooks/useFarms"
import { useWeather } from "@/hooks/useWeather"
import { farmPlaceCandidates, formatFarmPlace } from "@/lib/weather"
import { usePlanEntitlements } from "@/hooks/usePlanEntitlements"
import { PlanUpgradeBanner } from "@/components/PlanUpgradeBanner"

const CropCare = () => {
  const { farms } = useFarms()
  const entitlements = usePlanEntitlements()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "CropCare | AGRISENSE"
  }, [])

  const firstFarm = farms[0]
  const weatherPlace = firstFarm ? formatFarmPlace(firstFarm) : undefined
  const { weather } = useWeather({
    place: weatherPlace,
    placeCandidates: firstFarm ? farmPlaceCandidates(firstFarm) : undefined,
    useGeolocation: true,
    preferDevice: !weatherPlace,
  })

  useEffect(() => {
    if (!entitlements.aiRecommendations) {
      setRecommendations([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    predictionService
      .getRecommendations({ limit: 50 })
      .then((res) => {
        if (!active) return
        const list = (res.data ||
          res.items ||
          (Array.isArray(res) ? res : [])) as Recommendation[]
        setRecommendations(Array.isArray(list) ? list : [])
      })
      .catch(() => active && setRecommendations([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [entitlements.aiRecommendations])

  const soilDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    farms.forEach((f) => {
      const key = (f.soilType || "unknown").toString()
      counts[key] = (counts[key] || 0) + 1
    })
    return {
      labels: Object.keys(counts).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
      values: Object.values(counts),
    }
  }, [farms])

  const gaugeTemp = weather ? Math.round(weather.current.temperature) : 0

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Crop Care</h1>
        </div>

        {!entitlements.aiRecommendations && (
          <div className="mb-6">
            <PlanUpgradeBanner
              title="AI crop recommendations are on Pro"
              description="Starter includes basic farm & soil overview. Upgrade for personalised AI disease and crop tips."
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Crop Care Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {!entitlements.aiRecommendations ? (
                  <p className="py-6 text-sm text-gray-500">
                    AI recommendations unlock on Pro. Your soil overview and live temperature remain
                    available on Starter.
                  </p>
                ) : loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2C6E49]" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <EmptyState art="seedling" title="Crop care advice will appear here" text="Add your farm details in Settings and advice is prepared for you." compact />
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader className="bg-[#377552]">
                        <TableRow>
                          <TableHead className="font-medium text-white">Type</TableHead>
                          <TableHead className="font-medium text-white">Recommendation</TableHead>
                          <TableHead className="font-medium text-white">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recommendations.map((rec, index) => (
                          <TableRow
                            key={rec.id || index}
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                          >
                            <TableCell className="font-medium capitalize text-[#377552]">
                              {rec.type || "general"}
                            </TableCell>
                            <TableCell>
                              {rec.title || rec.description || rec.content || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {rec.createdAt
                                ? new Date(rec.createdAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Soil Types Across Farms</CardTitle>
              </CardHeader>
              <CardContent>
                <YieldChart
                  labels={soilDistribution.labels}
                  values={soilDistribution.values}
                  seriesLabel="Farms"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Field Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <TemperatureGauge value={gaugeTemp} />
                <p className="mt-2 text-center text-xs text-gray-400">
                  {weather
                    ? `Live from ${weather.location.name}`
                    : "Loading live temperature…"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CropCare
