"use client"

import { Check, Edit, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Crop {
  id: string
  status: string
  name: string
  plantingDate: string
  yield: string
}

interface CropTableProps {
  onSelectCrop: (cropId: string) => void
}

export function CropTable({ onSelectCrop }: CropTableProps) {
  // Sample data
  const crops: Crop[] = [
    { id: "1", status: "Ready", name: "Wheat", plantingDate: "Jan 7th", yield: "85%" },
    { id: "2", status: "Ready", name: "Corn", plantingDate: "Jan 15th", yield: "78%" },
    { id: "3", status: "Ready", name: "Soybean", plantingDate: "Jan 22nd", yield: "92%" },
    { id: "4", status: "Ready", name: "Rice", plantingDate: "Feb 3rd", yield: "65%" },
    { id: "5", status: "Ready", name: "Barley", plantingDate: "Feb 10th", yield: "73%" },
    { id: "6", status: "Ready", name: "Oats", plantingDate: "Feb 17th", yield: "81%" },
    { id: "7", status: "Ready", name: "Rye", plantingDate: "Feb 24th", yield: "69%" },
    { id: "8", status: "Ready", name: "Millet", plantingDate: "Mar 3rd", yield: "77%" },
    { id: "9", status: "Ready", name: "Sorghum", plantingDate: "Mar 10th", yield: "84%" },
    { id: "10", status: "Ready", name: "Quinoa", plantingDate: "Mar 17th", yield: "88%" },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-green-600">
          <TableRow>
            <TableHead className="text-white font-medium">Status</TableHead>
            <TableHead className="text-white font-medium">Name</TableHead>
            <TableHead className="text-white font-medium">Planting Date</TableHead>
            <TableHead className="text-white font-medium">Yield</TableHead>
            <TableHead className="text-white font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {crops.map((crop) => (
            <TableRow key={crop.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectCrop(crop.id)}>
              <TableCell>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  {crop.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{crop.name}</TableCell>
              <TableCell>{crop.plantingDate}</TableCell>
              <TableCell>{crop.yield}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Check size={16} className="text-green-600" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit size={16} />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
