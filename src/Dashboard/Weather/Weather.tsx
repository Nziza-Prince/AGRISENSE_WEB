"use client"

import { useEffect, useState } from "react"
import SideBar from "../SideBar"
import Navbar from "../Navbar"
import  {WeatherForecastChart}  from "./weather-forecast-chart"
import { CropRecommendationsTable } from "./crop-recommendations-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const Weather = () => {
  useEffect(() => {
    document.title = 'Weather | AGRISENSE';
  }, []);
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Format time as HH:MM AM/PM
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  // Format date as Day, Month DD | HH:MM AM
  const formattedDate =
    currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) +
    " | " +
    currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />

      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <div className="p-6 space-y-6">
          {/* Hero Weather Banner */}
          <div
            className="relative rounded-lg overflow-hidden h-72 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/assets/Dashboardicons/weather-page-image.png')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
            <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
              <div>
                <h1 className="text-3xl font-bold mb-1">Good Morning, Chance</h1>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{formattedTime}</div>
                  <div className="text-lg">{formattedDate}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl font-medium">Partly Cloudy</div>
                <div className="text-sm">Isolated thunderstorms, Precipitation: 30%</div>
              </div>
            </div>

            <div className="absolute top-6 right-6 bg-white/90 text-gray-800 px-4 py-1.5 rounded-md font-medium">
              Kigali, RWANDA
            </div>
          </div>

          {/* Monthly Weather Forecast */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monthly Weather Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherForecastChart />
            </CardContent>
          </Card>

          {/* Crop Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Crop Recommendations by Weather Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <CropRecommendationsTable />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Weather
