
import Navbar from './Navbar/Navbar'
import HeroSection from './HeroSection/Hero'
import PopularServices from './Popular-Services/PopularServices'
import AboutUs from './AboutUs/AboutUs'
import HowDoWeWork from './HowDoWeWork/HowDoWeWork'
import PricingPlan from './PricingPlan/PricingPlan'
import Counter from './Counter/Counter'
import SmartFarming from './smartFarmingBlog/smartFarming';
import WeatherSection from './WeatherSection'
import TestimonialCarousel from './Testimonies'
import Footer from './Footer'

const LandingPage = () => {
  return (
    <div id="home">
      <Navbar />
      <HeroSection />
      <div id="about">
        <AboutUs />
      </div>
      <div id="services">
        <PopularServices />
      </div>
      <HowDoWeWork />
      <PricingPlan />
      <Counter />
      <div id="blogs">
        <SmartFarming />
      </div>
      <WeatherSection />
      <TestimonialCarousel />
      <div id="contact">
        <Footer />
      </div>
    </div>
  )
}

export default LandingPage
