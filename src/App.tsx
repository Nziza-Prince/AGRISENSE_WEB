
import { Route, Routes } from 'react-router-dom'
import Dashboard from './Dashboard/Dashbooard'
import LandingPage from './landingPage/LandingPage'
import CropCare from './Dashboard/Cropcare/CropCare'
import SoilDetects from './Dashboard/SoilDetects/SoilDetects'
import Weather from './Dashboard/Weather'
import Analytics from './Dashboard/Analytics'
import Community from './Dashboard/Community'
import HelpandSupport from './Dashboard/HelpandSupport'
import Settings from './Dashboard/Settings'
import AboutUs from './landingPage/AboutUs/AboutUs'
import PopularServices from './landingPage/Popular-Services/PopularServices'
import SmartFarming from './landingPage/smartFarmingBlog/smartFarming'
import Footer from './landingPage/Footer'
function App() {
  return (
    <>

<Routes>

<Route path="/" element={<LandingPage/>}/>
<Route path="/dashboard" element={<Dashboard/>}/>
<Route path="/crop-care" element={<CropCare/>}/>
<Route path="/soil-detects" element={<SoilDetects/>}/>
<Route path="/weather" element={<Weather/>}/>
<Route path="/analytics" element={<Analytics/>}/>
<Route path="/community" element={<Community/>}/>
<Route path="/help-and-support" element={<HelpandSupport/>}/>
<Route path="/settings" element={<Settings/>}/>
<Route path="/about" element={<AboutUs />} />
<Route path="/services" element={<PopularServices />} />
<Route path="/blogs" element={<SmartFarming />} />
<Route path="/contacts" element={<Footer />} />


{/* <Route path="/pricing" element={<PricingPlan />} />  */}

</Routes>
    </>
  )
}

export default App
