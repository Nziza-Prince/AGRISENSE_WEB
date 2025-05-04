import type React from "react"
import SupplierMarketInsights from "/assets/serviceImages/SupplierMarketInsights.png"
import WeatherClimate from "/assets/serviceImages/WeatherAndClimate.png"
import FarmManagement from "/assets/serviceImages/FarmManagement.png"
import SoilCropAnalysis from "/assets/serviceImages/Soil-And-Crop-Analysis.png"
import GvtsNgos from "/assets/serviceImages/gvtsAndNgos.png"
import FarmerSupplier from "/assets/serviceImages/Farmer-Suppliaer-MarketPlace.png"
import supplierMarketIcon from "/assets/icons/supplier-market.svg"
import weatherClimateIcon from "/assets/icons/weather-climate.svg"
import farmManagementIcon from "/assets/icons/Farm-management.svg"
import soilCropIcon from "/assets/icons/soil-crop-analysis.svg"
import gorvenmentIcon from "/assets/icons/government.svg"
import farmerSupplierIcon from "/assets/icons/farmer-supplier.svg"

interface Service {
  title: string
  imageUrl: string
  icon: string
}

const PopularServices: React.FC = () => {
  const services: Service[] = [
    { title: "Supplier & Market Insights", imageUrl: SupplierMarketInsights, icon: supplierMarketIcon },
    { title: "Weather & Climate Monitor", imageUrl: WeatherClimate, icon: weatherClimateIcon },
    { title: "Farm Management", imageUrl: FarmManagement, icon: farmManagementIcon },
    { title: "Soil & Crop Analysis", imageUrl: SoilCropAnalysis, icon: soilCropIcon },
    { title: "Gvt & NGO Support", imageUrl: GvtsNgos, icon: gorvenmentIcon },
    { title: "Farmer-Supplier Marketplace", imageUrl: FarmerSupplier, icon: farmerSupplierIcon },
  ]

  return (
    <div className="bg-[#2C6E49F2] p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-white text-lg font-bold mb-3 sm:mb-5">Popular Services We Provide</p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Boost your farm's productivity today!</h1>
      </div>
      <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
        {services.map((service) => (
          <div
            key={service.title}
            className="bg-white flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            {/* Icon circle */}
            <div className="bg-[#2C6E49] w-12 sm:w-14 h-12 sm:h-14 flex items-center justify-center mb-3 sm:mb-4 rounded-full shadow-lg">
              <img src={service.icon || "/placeholder.svg"} alt="" className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-lg font-semibold text-center text-gray-800 mb-4 sm:mb-6">
              {service.title}
            </h2>

            {/* Image */}
            <div className="w-full max-w-xs aspect-video rounded-lg overflow-hidden">
              <img
                src={service.imageUrl || "/placeholder.svg"}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PopularServices
