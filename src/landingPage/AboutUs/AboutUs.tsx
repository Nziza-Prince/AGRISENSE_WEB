import type { FC } from "react"
import { Card } from "@/components/ui/card"
import AboutUsImage from "/assets/about us.png"

const AboutUs: FC = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-center mt-24 sm:mt-24 md:mt-24 mb-20 gap-4 md:gap-8 lg:gap-16 xl:gap-24 px-6 md:px-16 lg:px-24 xl:px-48 py-6 bg-white">
      {/* Left Side: Image + overlapping cards */}
      <div className="relative w-full max-w-[350px] h-[450px] mx-auto md:mx-0">
        {/* Main Image */}
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={AboutUsImage || "/placeholder.svg"}
            alt="Tree in water drop"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Overlapping Cards */}
        <div className="absolute text-lg font-semibold left-10 sm:-left-20 md:-left-10 lg:-left-20 top-10 flex flex-col space-y-4 z-10">
          <Card className="w-28 sm:w-32 text-center p-4 shadow-lg bg-white">
            <div className="text-sm font-semibold">10,000+</div>
            <div className="text-xs text-gray-600">Farmers Reached</div>
          </Card>
          <Card className="w-28 sm:w-32 text-center p-4 bg-green-600 text-white shadow-lg">
            <div className="text-sm font-semibold">100,000</div>
            <div className="text-xs">Hectares Covered</div>
          </Card>
          <Card className="w-28 sm:w-32 text-center p-4 shadow-lg bg-white">
            <div className="text-sm font-semibold">200+</div>
            <div className="text-xs text-gray-600">Suppliers Connected</div>
          </Card>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 pt-2 text-left mt-10 md:mt-3 text-base sm:text-lg md:text-lg lg:text-xl max-w-md md:max-w-sm lg:max-w-md xl:max-w-2xl mx-auto md:mx-0">
        <h2 className="text-3xl font-bold text-green-700 mb-4">About Us</h2>

        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-gray-800">Our mission</h3>
          <p className="text-gray-700 font-medium">
            AgriSense connects technology with agriculture, offering smart insights for farmers, suppliers, governments,
            and NGOs.
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-gray-800">Our story</h3>
          <p className="text-gray-700 font-medium mb-4">
            AgriSense leverages AI to provide real-time crop recommendations, soil analysis, and market insights,
            solving farming challenges with data-driven solutions.
          </p>
          <span className="text-green-600 text-lg cursor-pointer">more ➝</span>
        </div>
      </div>
    </section>
  )
}

export default AboutUs
