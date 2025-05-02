import React from 'react'
import Navbar from './Navbar/Navbar'
import HeroSection from './HeroSection/Hero'
import PopularServices from './Popular-Services/PopularServices'
import AboutUs from './AboutUs'

const LandingPage = () => {
  return (
    <div >
      <Navbar/>
      <HeroSection/>
      <AboutUs/>
      <PopularServices/>
    </div>
  )
}

export default LandingPage
