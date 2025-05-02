

const SmartFarming = () => {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-20 flex mt-30 flex-col items-center">
        <h1 className="font-bold text-2xl mb-16 text-center">Smart Farming Blog</h1>
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full">
          <img
            className="w-full md:w-1/2 lg:w-5/12 rounded-lg object-cover"
            src="/assets/smartFarmingImage.png"
            alt="Farmers working in green rice fields"
          />
          <div className="text-left w-full md:w-1/2 lg:w-7/12">
            <h2 className="font-bold text-xl text-[#0a7c42] mb-6">Latest Articles:</h2>
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex items-start gap-3">
                <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
                <p className="font-medium">5 Ways to Improve Soil Fertility Using AI</p>
              </div>
              <div className="flex items-start gap-3">
                <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
                <p className="font-medium">How Weather Patterns Impact Crop Yields</p>
              </div>
              <div className="flex items-start gap-3">
                <img src="/assets/smartFarmingIcon.svg" alt="Green arrow" className="w-5 h-5 mt-1" />
                <p className="font-medium">Smart Irrigation Techniques to Save Water & Boost Growth</p>
              </div>
            </div>
            <button className="bg-[#0a7c42] hover:bg-[#086835] cursor-pointer text-white px-8 py-2 rounded-md font-medium">
              Read More
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  export default SmartFarming
  