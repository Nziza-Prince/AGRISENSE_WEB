"use client"

interface CropScheduleItem {
  id: string
  crop: string
  phase: string
  startWeek: number
  duration: number
  color: string
}

export function CropTimeline() {
  const crops: CropScheduleItem[] = [
    { id: "1", crop: "Wheat", phase: "Planting", startWeek: 10, duration: 8, color: "bg-green-600" },
    { id: "2", crop: "Potatoes", phase: "Growing", startWeek: 18, duration: 12, color: "bg-green-500" },
    { id: "3", crop: "Carrots", phase: "Planting", startWeek: 25, duration: 6, color: "bg-green-400" },
    { id: "4", crop: "Maize", phase: "Growing", startWeek: 32, duration: 10, color: "bg-green-700" },
    { id: "5", crop: "Barley", phase: "Harvest", startWeek: 42, duration: 8, color: "bg-green-300" },
  ]

  // Generate weeks (1-52)
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Timeline header */}
        <div className="flex mb-4">
          <div className="w-24 flex-shrink-0"></div>
          <div className="flex-1 grid grid-cols-52 gap-0">
            {weeks.map((week) => (
              <div key={week} className={`text-xs text-center ${week % 4 === 0 ? "font-medium" : "text-gray-400"}`}>
                {week % 4 === 0 ? week : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline rows */}
        {crops.map((item) => (
          <div key={item.id} className="flex mb-4 items-center">
            <div className="w-24 flex-shrink-0 pr-4">
              <div className="font-medium text-sm">{item.crop}</div>
              <div className="text-xs text-gray-500">{item.phase}</div>
            </div>
            <div className="flex-1 grid grid-cols-52 gap-0 h-8 relative">
              {/* Background grid */}
              {weeks.map((week) => (
                <div key={week} className={`border-r border-gray-100 ${week % 4 === 0 ? "border-gray-200" : ""}`}></div>
              ))}

              {/* Crop timeline bar */}
              <div
                className={`absolute h-6 rounded-sm ${item.color}`}
                style={{
                  left: `${(item.startWeek - 1) * (100 / 52)}%`,
                  width: `${item.duration * (100 / 52)}%`,
                  top: "4px",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
