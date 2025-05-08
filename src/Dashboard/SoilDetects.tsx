import React from 'react'
import SideBar from './SideBar'
import Navbar from './Navbar'

const SoilDetects = () => {
  return (
<div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <h1>Soil Detects</h1>

       </main>
    </div>
  )
}

export default SoilDetects
