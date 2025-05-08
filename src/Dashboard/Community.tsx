import React from 'react'
import Navbar from './Navbar'
import SideBar from './SideBar'

const Community = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <h1>Community</h1>

       </main>
    </div>
  )
}

export default Community
