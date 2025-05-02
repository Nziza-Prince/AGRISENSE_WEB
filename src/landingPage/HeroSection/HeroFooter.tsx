import { FC, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const FilterBar: FC = () => {
  const [continent, setContinent] = useState("Africa")
  const [country, setCountry] = useState("Rwanda")
  const [district, setDistrict] = useState("Nyagatare")
  const [activeMenu, setActiveMenu] = useState<"location" | "soil" | "market" | null>(null)

  return (
    <div className="md:mb-48 bg-white mx-20 sm:mx-8 px-4 md:px-20 py-4 border-b-4 shadow-xl">
      {/* Headings */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-4 pb-2 mb-4 space-y-2 sm:space-y-0">
        <div className="flex flex-wrap sm:space-x-12 space-x-6 font-bold text-lg ml-2 sm:ml-5">
          <span className={activeMenu === "location" ? "text-green-600" : ""}>Location</span>
          <span className={activeMenu === "soil" ? "text-green-600" : ""}>Soil Type</span>
          <span className={activeMenu === "market" ? "text-green-600" : ""}>Market</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm font-semibold">
              Last Searching <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Recent</DropdownMenuItem>
            <DropdownMenuItem>Popular</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dropdowns + Search */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
        <div className="flex flex-wrap gap-24 text-sm">
          {/* Location */}
          <div className="w-full sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-32 justify-between">
                  Continent <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setContinent("Africa")}>Africa</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setContinent("Asia")}>Asia</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-1 text-xs text-center">{continent}</div>
          </div>

          {/* Country */}
          <div className="w-full sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-32 justify-between">
                  Country <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCountry("Rwanda")}>Rwanda</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCountry("Kenya")}>Kenya</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-1 text-xs text-center">{country}</div>
          </div>

          {/* District/State */}
          <div className="w-full sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-32 justify-between">
                  District/state <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDistrict("Nyagatare")}>Nyagatare</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDistrict("Kigali")}>Kigali</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-1 text-xs text-center">{district}</div>
          </div>
        </div>

        {/* Search Input */}
        <Input placeholder="Search ..." className="w-full sm:w-64" />
      </div>
    </div>
  )
}

export default FilterBar
