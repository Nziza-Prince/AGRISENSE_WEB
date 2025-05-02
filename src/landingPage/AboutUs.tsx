import { FC } from "react"
import { Card } from "@/components/ui/card"
import AboutUsImage from "../assets/about us.png"

const AboutUs: FC = () => {
  return (
    <section className="flex flex-col md:flex-row items-start gap-36 px-96 py-6 bg-white">
      {/* Left Side: Image + overlapping cards */}
      <div className="relative w-[350px] h-[450px]">
        {/* Main Image */}
        <div className="w-full h-full border-4 border-blue-500 rounded-lg overflow-hidden">
          <img
            src={AboutUsImage}
            alt="Tree in water drop"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Overlapping Cards */}
        <div className="absolute left-[-100px] top-10 flex flex-col space-y-4 z-10">
          <Card className="w-32 text-center p-4 shadow-lg bg-white">
            <div className="text-sm font-semibold">10,000+</div>
            <div className="text-xs text-gray-600">Farmers Reached</div>
          </Card>
          <Card className="w-32 text-center p-4 bg-green-600 text-white shadow-lg">
            <div className="text-sm font-semibold">100,000</div>
            <div className="text-xs">Hectares Covered</div>
          </Card>
          <Card className="w-32 text-center p-4 shadow-lg bg-white">
            <div className="text-sm font-semibold">200+</div>
            <div className="text-xs text-gray-600">Suppliers Connected</div>
          </Card>
        </div>
      </div>

      {/* Right Side */}
      <div className="max-w-xl pt-2 text-left text-2xl mt-3">
        <h2 className="text-3xl font-bold text-green-700 mb-4">About Us</h2>

        <div className="mb-4">
          <h3 className="mb-4 font-semibold text-gray-800 focus-within:text-green-600">Our mission</h3>
          <p className="text-xl text-gray-700 font-medium">
            AgriSense connects technology with agriculture, offering smart insights for farmers,
            suppliers, governments, and NGOs.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-gray-800 focus-within:text-green-600">Our story</h3>
          <p className="text-xl text-gray-700 font-medium">
            AgriSense leverages AI to provide real-time crop recommendations, soil analysis, and market
            insights, solving farming challenges with data-driven solutions.{" "}
          </p>
            <span className="text-green-600 text-lg cursor-pointer mt-20">more ➝</span>
        </div>
      </div>
    </section>
  )
}

export default AboutUs
