"use client"

import { Edit } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Crop {
  id: string
  name: string
  farmer: {
    name: string
    image: string
  }
  months: string
  funds: string
  growthRate: string
}

interface CropTableProps {
  onSelectCrop: (cropId: string) => void
}

export function CropTable({ onSelectCrop }: CropTableProps) {
  // Sample data matching the image structure
  const crops: Crop[] = [
    {
      id: "1",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "2",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "3",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "4",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "5",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "6",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "7",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "8",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "9",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "10",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "10",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "10",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
    {
      id: "10",
      name: "Maize",
      farmer: { name: "Shawn", image: "/assets/farmer.png" },
      months: "Jan - May",
      funds: "$20",
      growthRate: "Middle",
    },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-green-600">
          <TableRow>
            <TableHead className="text-white font-medium w-12"></TableHead>
            <TableHead className="text-white font-medium">Crop Name</TableHead>
            <TableHead className="text-white font-medium">Farmer</TableHead>
            <TableHead className="text-white font-medium">Months</TableHead>
            <TableHead className="text-white font-medium">Funds</TableHead>
            <TableHead className="text-white font-medium">Growth-rate</TableHead>
            <TableHead className="text-white font-medium w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {crops.map((crop, index) => (
            <TableRow
              key={crop.id}
              className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              onClick={() => onSelectCrop(crop.id)}
            >
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="font-medium">{crop.name}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={crop.farmer.image || "/placeholder.svg"}
                      alt={crop.farmer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{crop.farmer.name}</div>
                    <div className="text-xs text-gray-500">Farming Records</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-green-600 font-medium">{crop.months}</TableCell>
              <TableCell className="font-medium">{crop.funds}</TableCell>
              <TableCell>{crop.growthRate}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Edit size={16} />
                  <span className="sr-only">Edit</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
 