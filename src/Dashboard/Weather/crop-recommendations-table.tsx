"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CropRecommendation {
  id: string
  cropType: string
  hotDry: string
  warmModerate: string
  rainyHumid: string
  coldFrosty: string
}

export function CropRecommendationsTable() {
  const recommendations: CropRecommendation[] = [
    {
      id: "1",
      cropType: "Crops 1",
      hotDry: "Millet",
      warmModerate: "Maize",
      rainyHumid: "Table Body",
      coldFrosty: "Table Body",
    },
    {
      id: "2",
      cropType: "Crops 2",
      hotDry: "Sorghum",
      warmModerate: "Tomatoes",
      rainyHumid: "Table Body",
      coldFrosty: "Table Body",
    },
    {
      id: "3",
      cropType: "Crops 3",
      hotDry: "Cactus Pear",
      warmModerate: "Beans",
      rainyHumid: "Table Body",
      coldFrosty: "Table Body",
    },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-green-700 text-white font-medium">Crop Type</TableHead>
            <TableHead className="bg-green-700 text-white font-medium">Hot & Dry (Arid)</TableHead>
            <TableHead className="bg-green-700 text-white font-medium">Warm & Moderate</TableHead>
            <TableHead className="bg-green-700 text-white font-medium">Rainy & Humid</TableHead>
            <TableHead className="bg-green-700 text-white font-medium">Cold & Frosty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recommendations.map((rec) => (
            <TableRow key={rec.id}>
              <TableCell className="bg-green-600 text-white font-medium">{rec.cropType}</TableCell>
              <TableCell>{rec.hotDry}</TableCell>
              <TableCell>{rec.warmModerate}</TableCell>
              <TableCell>{rec.rainyHumid}</TableCell>
              <TableCell>{rec.coldFrosty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
