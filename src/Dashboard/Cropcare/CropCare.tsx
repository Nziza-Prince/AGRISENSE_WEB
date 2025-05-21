"use client"

import { useState } from "react"
import SideBar from "../SideBar"
import Navbar from "../Navbar"
import { CropTable } from "./crop-table"
import { YieldChart } from "./yield-chart"
import { TemperatureGauge } from "./temperature-gauge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const CropCare = () => {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null)

  console.log(selectedCrop)
  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />

      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Crop Care</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CropTable onSelectCrop={setSelectedCrop} />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Growth Yields</CardTitle>
                </CardHeader>
                <CardContent>
                  <YieldChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemperatureGauge value={28} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CropCare
