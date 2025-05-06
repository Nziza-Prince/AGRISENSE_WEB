import React from 'react';
import SideBar from './SideBar';
import Navbar from './Navbar';


const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <SideBar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="p-6 overflow-auto">
          <div>
            <h1>Good Morning</h1>
            <div>
                <h1>34c - <span>Sunny with clear</span></h1>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
