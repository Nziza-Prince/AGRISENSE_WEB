import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SoilTypeCardProps {
  title: string
  soilType: string
  color: string
  percentage: number
}

const SoilTypeCard = ({ title, soilType, color, percentage }: SoilTypeCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${color}`} />
      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              {soilType}
            </Badge>
            <span className="text-xs text-gray-500">{percentage}% humidity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SoilTypeCards() {
  const soilTypes = [
    { title: "Maize", soilType: "Loam", color: "bg-gray-800", percentage: 35 },
    { title: "Potatoes", soilType: "Podzolic", color: "bg-green-600", percentage: 40 },
    { title: "Maize", soilType: "Loam", color: "bg-gray-800", percentage: 35 },
    { title: "Carrots", soilType: "Chernozem", color: "bg-green-600", percentage: 45 },
    { title: "Barley", soilType: "Sandy", color: "bg-gray-800", percentage: 30 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {soilTypes.map((soil, index) => (
        <SoilTypeCard
          key={index}
          title={soil.title}
          soilType={soil.soilType}
          color={soil.color}
          percentage={soil.percentage}
        />
      ))}
    </div>
  )
}
