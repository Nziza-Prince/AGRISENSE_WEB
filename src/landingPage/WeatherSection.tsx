

const WeatherSection = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 mb-20 flex mt-36 flex-col items-center">
            <div className="flex flex-col md:flex-row-reverse gap-8 md:gap-12 w-full">
        <img
          className="w-full md:w-1/2 lg:w-5/12 rounded-lg object-cover"
          src="/assets/WeatherMan.png"
          alt="Weather forecast map with meteorologist"
        />
        <div className="text-left w-full md:w-1/2 lg:w-7/12">
          <h2 className="font-bold text-xl text-[#0a7c42] mb-6">Weather Updates:</h2>
          <div className="flex flex-col gap-5 mb-8">
            <div className="flex items-start gap-3">
              <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
              <p className="font-medium">Rainfall expected next week – delay irrigation!</p>
            </div>
            <div className="flex items-start gap-3">
              <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
              <p className="font-medium">Drought conditions in Region X – recommended crop</p>
            </div>
            <div className="flex items-start gap-3">
              <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
              <p className="font-medium">Temperature dropping in Region Y – Protect sensitive crop</p>
            </div>
          </div>
          <button className="bg-[#0a7c42] hover:bg-[#086835] text-white px-8 py-2 rounded-md font-medium">
            Read More
          </button>
        </div>
      </div>
    </div>
  )
}

export default WeatherSection
