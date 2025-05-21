import SideBar from "../SideBar"
import Navbar from "../Navbar"
import { SoilTypeCards } from "./soil-type-cards"
import { SoilGrowthChart } from "./soil-growth-chart"
import { CropTimeline } from "./crop-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SoilDetects = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />

      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-800">Soil Detects</h1>
          </div>

          <SoilTypeCards />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Soil Growth Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <SoilGrowthChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Planting Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <CropTimeline />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default SoilDetects
