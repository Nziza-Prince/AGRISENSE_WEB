import HeroImage from "/assets/HeroImage.png"
import FilterBar from "./HeroFooter"

export default function HeroSection() {
  return (
    <div
      className="relative mb-48 sm:mb-56 md:mb-64 lg:mb-72 bg-cover flex flex-col pt-20 sm:pt-24 md:pt-32 lg:pt-36 text-center bg-center min-h-[450px] w-full"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      {/* Hero Section */}
      <div className="mb-16 sm:mb-20 md:mb-24 lg:mb-32 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-white mb-4 sm:mb-6 md:mb-8 text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
          Revolutionizing Agriculture
        </h1>
        <p className="font-semibold text-lg sm:text-xl md:text-2xl text-white max-w-2xl mx-auto">
          Empowering users with AGRISENSE app for sustainable farming
        </p>
      </div>

      {/* Foot of the Hero */}
      <div className="absolute left-0 right-0 bottom-0 transform translate-y-1/2 px-2 sm:px-4">
        <FilterBar />
      </div>
    </div>
  )
}
