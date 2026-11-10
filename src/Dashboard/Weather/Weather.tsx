import DashboardLayout from "../DashboardLayout"
import { useEffect, useMemo, useState } from "react"
import { WeatherForecastChart } from "./weather-forecast-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Gauge, MapPin, Thermometer, Wind, Loader2, AlertTriangle, Info, CheckCircle2 } from "lucide-react"
import WeatherIcon from "@/components/WeatherIcon"
import { useAuth } from "@/context/useAuth"
import { useFarms } from "@/hooks/useFarms"
import { useWeather } from "@/hooks/useWeather"
import { getFarmingAdvisories, farmPlaceCandidates, formatFarmPlace, type Advisory } from "@/lib/weather"
import { getUserDisplayName } from "@/lib/user"
import { usePlanEntitlements } from "@/hooks/usePlanEntitlements"
import { PlanUpgradeBanner } from "@/components/PlanUpgradeBanner"

const Weather = () => {
  const { user } = useAuth()
  const { farms } = useFarms()
  const entitlements = usePlanEntitlements()
  const displayName = getUserDisplayName(user)
  const [farmId, setFarmId] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    document.title = "Weather | AGRISENSE"
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const selectedFarm = farms.find((f) => f.id === farmId)
  const place = selectedFarm ? formatFarmPlace(selectedFarm) : undefined

  const { weather, loading, error } = useWeather({
    place,
    placeCandidates: selectedFarm ? farmPlaceCandidates(selectedFarm) : undefined,
    useGeolocation: true,
    preferDevice: !place,
  })

  const forecastDays = weather?.daily.slice(0, entitlements.weatherDays) ?? []

  const advisories = useMemo<Advisory[]>(
    () => (weather ? getFarmingAdvisories(weather) : []),
    [weather],
  )

  const greeting = (() => {
    const h = currentTime.getHours()
    if (h < 12) return "Good Morning"
    if (h < 18) return "Good Afternoon"
    return "Good Evening"
  })()

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const locationName = weather
    ? [weather.location.name, weather.location.admin1, weather.location.country]
        .filter(Boolean)
        .join(", ")
    : "Locating…"

  return (
    <DashboardLayout>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-gray-800">Weather</h1>
            {farms.length > 0 && (
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#2C6E49]"
              >
                <option value="">My location</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Hero Weather Banner */}
          <div
            className="relative rounded-xl overflow-hidden min-h-72 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/assets/Dashboardicons/weather-page-image.webp')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white min-h-72">
              <div>
                <h2 className="text-3xl font-bold mb-1">
                  {greeting}
                  {displayName !== "Guest" ? `, ${displayName}` : ""}
                </h2>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{formattedTime}</div>
                  <div className="text-lg">
                    {formattedDate} | {formattedTime}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  {loading ? (
                    <div className="flex items-center gap-2 text-white/90">
                      <Loader2 className="h-5 w-5 animate-spin" /> Loading weather…
                    </div>
                  ) : weather ? (
                    <>
                      <div className="flex items-center gap-3">
                        <WeatherIcon category={weather.current.category} className="h-10 w-10" />
                        <span className="text-5xl font-bold">
                          {Math.round(weather.current.temperature)}°C
                        </span>
                      </div>
                      <div className="text-xl font-medium">{weather.current.label}</div>
                      <div className="text-sm text-white/80">
                        Feels like {Math.round(weather.current.apparentTemperature)}°C ·
                        Precipitation {weather.current.precipitation} mm
                      </div>
                    </>
                  ) : (
                    <div className="text-white/90">{error || "Weather unavailable."}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 max-w-[calc(100%-2rem)] bg-white/90 text-gray-800 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 text-sm truncate">
              <MapPin className="h-4 w-4 text-[#2C6E49] shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>
          </div>

          {/* Current conditions detail */}
          {weather && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={<Thermometer className="h-5 w-5" />} label="Feels like" value={`${Math.round(weather.current.apparentTemperature)}°C`} />
              <MetricCard icon={<Droplets className="h-5 w-5" />} label="Humidity" value={`${weather.current.humidity}%`} />
              <MetricCard icon={<Wind className="h-5 w-5" />} label="Wind" value={`${Math.round(weather.current.windSpeed)} km/h`} />
              <MetricCard icon={<Gauge className="h-5 w-5" />} label="Precipitation" value={`${weather.current.precipitation} mm`} />
            </div>
          )}

          {/* Forecast strip limited by plan (Starter 3 days, Pro 7) */}
          {weather && forecastDays.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {entitlements.weatherDays}-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entitlements.weatherDays < 7 && (
                  <div className="mb-4">
                    <PlanUpgradeBanner
                      compact
                      title={`Starter shows ${entitlements.weatherDays} days — Pro unlocks 7-day outlook`}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                  {forecastDays.map((d) => (
                    <div key={d.date} className="rounded-lg border p-3 text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <WeatherIcon category={d.category} className="h-7 w-7 mx-auto my-2 text-[#2C6E49]" />
                      <p className="text-sm font-bold">{Math.round(d.tempMax)}°</p>
                      <p className="text-xs text-gray-400">{Math.round(d.tempMin)}°</p>
                      <p className="text-[11px] text-blue-500 mt-1">{Math.round(d.precipitationProbability)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Temperature Trend ({entitlements.weatherDays} days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherForecastChart daily={forecastDays} />
            </CardContent>
          </Card>

          {/* Smart advisories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Smart Farming Advisories</CardTitle>
            </CardHeader>
            <CardContent>
              {advisories.length === 0 ? (
                <p className="text-sm text-gray-500">Advisories will appear once weather loads.</p>
              ) : (
                <div className="space-y-3">
                  {advisories.map((a, i) => (
                    <AdvisoryRow key={i} advisory={a} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-green-100 text-[#2C6E49] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function AdvisoryRow({ advisory }: { advisory: Advisory }) {
  const styles: Record<Advisory["level"], { bg: string; text: string; icon: React.ReactNode }> = {
    info: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: <Info className="h-5 w-5" /> },
    success: { bg: "bg-green-50 border-green-200", text: "text-green-700", icon: <CheckCircle2 className="h-5 w-5" /> },
    warning: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <AlertTriangle className="h-5 w-5" /> },
    danger: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: <AlertTriangle className="h-5 w-5" /> },
  }
  const s = styles[advisory.level]
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${s.bg}`}>
      <span className={s.text}>{s.icon}</span>
      <div>
        <p className={`font-semibold text-sm ${s.text}`}>{advisory.title}</p>
        <p className="text-sm text-gray-600">{advisory.detail}</p>
      </div>
    </div>
  )
}

export default Weather
