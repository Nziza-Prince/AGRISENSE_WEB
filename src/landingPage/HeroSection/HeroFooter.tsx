import { type FC, useState } from "react"
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
    <div className="bg-white mx-auto max-w-[calc(100%-16px)] sm:max-w-[calc(100%-32px)] md:max-w-[calc(100%-64px)] lg:max-w-[calc(100%-128px)] px-3 sm:px-4 md:px-8 lg:px-20 py-3 sm:py-4 border-b-4 shadow-xl rounded-md">
      {/* Headings */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-4 pb-2 mb-3 sm:mb-4 space-y-2 sm:space-y-0">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 md:gap-8 lg:gap-12 font-bold text-base sm:text-lg">
          <span className={activeMenu === "location" ? "text-[#377552]" : ""}>Location</span>
          <span className={activeMenu === "soil" ? "text-[#377552]" : ""}>Soil Type</span>
          <span className={activeMenu === "market" ? "text-[#377552]" : ""}>Market</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-xs sm:text-sm font-semibold">
              Last Searching <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Recent</DropdownMenuItem>
            <DropdownMenuItem>Popular</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dropdowns + Search */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4 sm:gap-5">
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 md:gap-6 lg:gap-12 text-xs sm:text-sm">
          {/* Location */}
          <div className="w-[calc(33%-8px)] sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-24 md:w-28 lg:w-32 justify-between text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9"
                >
                  Continent <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
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
          <div className="w-[calc(33%-8px)] sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-24 md:w-28 lg:w-32 justify-between text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9"
                >
                  Country <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
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
          <div className="w-[calc(33%-8px)] sm:w-auto">
            <DropdownMenu onOpenChange={(open) => setActiveMenu(open ? "location" : null)}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-24 md:w-28 lg:w-32 justify-between text-xs sm:text-sm py-1 px-2 sm:px-3 h-8 sm:h-9"
                >
                  District <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
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
        <Input placeholder="Search ..." className="w-full sm:w-48 md:w-56 lg:w-64 h-8 sm:h-9 text-xs sm:text-sm" />
      </div>
    </div>
  )
}

export default FilterBar
