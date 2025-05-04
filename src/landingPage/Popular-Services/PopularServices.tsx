import React from 'react'
import  { Service } from './ProductCard';
import SupplierMarketInsights from '/assets/serviceImages/SupplierMarketInsights.png'
import WeatherClimate from '/assets/serviceImages/WeatherAndClimate.png'
import FarmManagement from '/assets/serviceImages/FarmManagement.png'
import SoilCropAnalysis from '/assets/serviceImages/Soil-And-Crop-Analysis.png'
import GvtsNgos from '/assets/serviceImages/gvtsAndNgos.png'
import FarmerSupplier from '/assets/serviceImages/Farmer-Suppliaer-MarketPlace.png'
import supplierMarketIcon from '/assets/icons/supplier-market.svg'
import weatherClimateIcon from '/assets/icons/weather-climate.svg'
import farmManagementIcon from '/assets/icons/Farm-management.svg'
import soilCropIcon from '/assets/icons/soil-crop-analysis.svg'
import gorvenmentIcon from '/assets/icons/government.svg'
import farmerSupplierIcon from '/assets/icons/farmer-supplier.svg'

const PopularServices: React.FC = () => {
    const services: Service[] = [
        { title: "Supplier & Market Insights", imageUrl: SupplierMarketInsights, icon: supplierMarketIcon },
      { title: "Weather & Climate Monitor", imageUrl:WeatherClimate,icon:weatherClimateIcon},
      { title: "Farm Management", imageUrl: FarmManagement,icon:farmManagementIcon},
      { title: "Soil & Crop Analysis", imageUrl:SoilCropAnalysis,icon:soilCropIcon },
      { title: "Gvt & NGO Support", imageUrl: GvtsNgos,icon:gorvenmentIcon },
      { title: "Farmer-Supplier Marketplace", imageUrl: FarmerSupplier,icon:farmerSupplierIcon},
    ];
  
    return (
      <div className=" bg-[#2C6E49F2] p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <p className="text-white text-lg font-bold mb-5">Popular Services We Provide</p>
          <h1 className="text-2xl font-bold text-white">Boost your farm’s productivity today!</h1>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {services.map(service => (
    <div
      key={service.title}
      className="bg-white flex flex-col items-center p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      {/* Icon circle */}
      <div className="bg-[#2C6E49] w-14 h-14 flex items-center justify-center mb-4 rounded-full shadow-lg">
        <img src={service.icon} alt="" className="w-6 h-6" />
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-center text-gray-800 mb-6">
        {service.title}
      </h2>

      {/* Image */}
      <img
        src={service.imageUrl}
        alt={service.title}
        className="w-96 h-64 max-w-xs rounded-lg object-cover"
      />
    </div>
  ))}
</div>

      </div>
    );
  };

export default PopularServices
