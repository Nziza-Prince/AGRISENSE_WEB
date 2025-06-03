import { Facebook, Instagram, Linkedin, MapPin, MessageSquare } from "lucide-react"


const Footer:React.FC = () => {
  return (
    <footer className="relative mt-20">
      {/* Top Wave */}
      <div className="bg-[#377552] h-12 sm:h-16 relative"></div>

      {/* Contact Card */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-4 sm:top-8 z-10 w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-64px)] md:max-w-3xl mx-auto">
        <div className="bg-white rounded-md shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-0">Ready to Get Started ?</h3>
          <button className="cursor-pointer bg-[#377552] hover:bg-[#086835] text-white px-4 sm:px-6 py-2 rounded-md text-sm sm:text-base">
            Contact us
          </button>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-[#377552] pt-32 sm:pt-28 md:pt-24 pb-6 sm:pb-8 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center sm:text-left">
            {/* Location and Social */}
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center mb-3 sm:mb-4">
                <MapPin className="mr-2" size={18} />
                <span className="font-medium text-sm sm:text-base">Nyabihu, RWANDA</span>
              </div>
              <div className="flex space-x-4 mt-1 sm:mt-2">
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <Facebook size={16} className="sm:size-[18px]" />
                </a>
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <Instagram size={16} className="sm:size-[18px]" />
                </a>
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <Linkedin size={16} className="sm:size-[18px]" />
                </a>
                <a href="#" className="hover:text-gray-200 transition-colors">
                  <MessageSquare size={16} className="sm:size-[18px]" />
                </a>
              </div>
            </div>

            {/* Get In Touch */}
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Get In Touch</h4>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>+250 788888888</li>
                <li>agrisense@gmail.com</li>
                <li>123 RCA-CORE, RWANDA</li>
              </ul>
            </div>

            {/* Services */}
            <div className="mt-6 sm:mt-0">
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Services</h4>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Soil & Crop Analysis</li>
                <li>Supplier of Market Insights</li>
                <li>Weather & Climate Monitoring</li>
                <li>Government & NGO Support</li>
                <li>Farm Management Tools</li>
              </ul>
            </div>

            {/* Who We Are */}
            <div className="mt-6 sm:mt-0">
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Who We Are</h4>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>
                  <a href="#" className="hover:underline transition-colors">
                    News
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline transition-colors">
                    About us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline transition-colors">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline transition-colors">
                    Sitemap
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-green-600/30 text-center text-xs sm:text-sm text-white/70">
            <p>© {new Date().getFullYear()} AgriSense. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
