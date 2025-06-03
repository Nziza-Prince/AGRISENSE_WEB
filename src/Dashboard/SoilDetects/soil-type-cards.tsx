import { Card, CardContent } from "@/components/ui/card"

interface SoilTypeCardProps {
  title: string
  soilType: string
  color: string
  percentage: number
  text_color:string
}

const SoilTypeCard = ({ title, soilType, color, percentage,text_color }: SoilTypeCardProps) => {
  return (
    <Card className={`overflow-hidden ${color} shadow-xl p-4 ${text_color}`}>
          <h3 className="font-medium text-lg">{soilType}</h3>
      <h3 className="font-bold text-xl">{title}</h3>
    <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h1></h1>
            <span className="text-xs">{percentage}% humidity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SoilTypeCards() {
  const soilTypes = [
    {text_color: "text-gray-700",title: "Maize", soilType: "Loam", color: "bg-white", percentage: 35 },
    {text_color: "text-gray-100",title: "Potatoes", soilType: "Podzolic", color: "bg-[#377552]", percentage: 40 },
    {text_color: "text-gray-700",title: "Maize", soilType: "Loam", color: "bg-white", percentage: 35 },
    {text_color: "text-gray-100",title: "Carrots", soilType: "Chernozem", color: "bg-[#377552]", percentage: 45 },
    {text_color: "text-gray-700",title: "Barley", soilType: "Sandy", color: "bg-white", percentage: 30 },
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
          text_color={soil.text_color}
        />
      ))}
    </div>
  )
}
