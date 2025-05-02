import { FC, useState } from "react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const FilterBar: FC = () => {
  const [continent, setContinent] = useState("Africa")
  const [country, setCountry] = useState("Rwanda")
  const [district, setDistrict] = useState("Nyagatare")
  const [activeMenu, setActiveMenu] = useState<"location" | "soil" | "market" | null>(null)

  return (
    <div className="bg-white px-6 py-4 md:mx-20 sm:mx-0 mx-36 border-b-4 shadow-2xl ">
      {/* Headings */}
      <div className="flex justify-between items-center border-b-4 pb-2 mb-4">
        <div className="flex space-x-12 font-bold text-lg ml-5 mb-4">
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

      {/* Dropdowns */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex space-x-6 text-sm">
          {/* Location */}
          <div>
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-32 justify-between">
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

          {/* Soil Type */}
          <div>
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "soil" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-32 justify-between">
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

          {/* Market */}
          <div>
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "market" : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-32 justify-between">
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

        <Input placeholder="Search ..." className="w-64" />
      </div>
    </div>
  )
}

export default FilterBar
