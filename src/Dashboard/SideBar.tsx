import React from 'react';

interface SidebarLinks {
  title: string;
  icon: string;
}

const SideBar = () => {
  const Links: SidebarLinks[] = [
    { title: "Dashboard", icon: "/assets/Dashboardicons/Dashboard.svg" },
    { title: "Crop Care", icon: "/assets/Dashboardicons/cropcare.svg" },
    { title: "Soil Detects", icon: "/assets/Dashboardicons/soilDetects.svg" },
    { title: "Weather", icon: "/assets/Dashboardicons/weather.svg" },
    { title: "Analytics", icon: "/assets/Dashboardicons/analysis.svg" },
    { title: "Community", icon: "/assets/Dashboardicons/community.svg" },
    { title: "Help & Support", icon: "/assets/Dashboardicons/help.svg" },
    { title: "Settings", icon: "/assets/Dashboardicons/settings.svg" },
    { title: "Logout", icon: "/assets/Dashboardicons/Logout.svg" }
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r shadow-sm p-6 flex flex-col">
      {/* Logo Section */}
      <div className="mb-8 flex">
        <img src="/assets/logo.png" alt="Logo" className="w-14" />
        <h1 className="text-xl font-bold text-center mt-2">
          <span className="text-green-600">AGRI</span>SENSE
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-4">
        {Links.map((link, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2 hover:bg-green-100 rounded-md cursor-pointer transition">
            <img className="w-5 h-5" src={link.icon} alt={`${link.title} icon`} />
            <span className="text-sm font-medium">{link.title}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SideBar;
