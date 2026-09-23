
import Navbar from './Navbar/Navbar'
import HeroSection from './HeroSection/Hero'
import PopularServices from './Popular-Services/PopularServices'
import AboutUs from './AboutUs/AboutUs'
import HowDoWeWork from './HowDoWeWork/HowDoWeWork'
import PricingPlan from './PricingPlan/PricingPlan'
import Counter from './Counter/Counter'
import Partners from './Partners'
import SmartFarming from './smartFarmingBlog/smartFarming';
import WeatherSection from './WeatherSection'
import TestimonialCarousel from './Testimonies'
import Waitlist from './Waitlist'
import FaqSection from './FaqSection'
import Footer from './Footer'
import AppDownloadFab from '@/components/AppDownloadFab'
import { useEffect } from 'react'
import Reveal from './Reveal'

const LandingPage = () => {
      useEffect(() => {
        window.scrollTo(0, 0);
      }, []);
  return (
    <div id="home">
      <Navbar />
      <main id="main-content">
      <Reveal><HeroSection /></Reveal>
      <div id="about">
        <Reveal><AboutUs /></Reveal>
      </div>
      <div id="services">
        <Reveal><PopularServices /></Reveal>
      </div>
      <Reveal><HowDoWeWork /></Reveal>
      <Reveal><PricingPlan /></Reveal>
      <Reveal><Counter /></Reveal>
      <Reveal><Partners /></Reveal>
      <div id="blogs">
        <Reveal><SmartFarming /></Reveal>
      </div>
      <Reveal><WeatherSection /></Reveal>
      <Reveal><TestimonialCarousel /></Reveal>
      <Reveal><Waitlist /></Reveal>
      <Reveal><FaqSection /></Reveal>
      </main>
      <div id="contact">
        <Footer />
      </div>
      <AppDownloadFab />
    </div>
  )
}

export default LandingPage
