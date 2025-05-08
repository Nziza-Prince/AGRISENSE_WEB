
import { NavLink } from 'react-router-dom';

interface SidebarLinks {
  title: string;
  icon: string;
  path: string;
}


const SideBar = () => {
  const Links: SidebarLinks[] = [
    { title: "Dashboard", icon: "/assets/Dashboardicons/Dashboard.svg", path: "/dashboard" },
    { title: "Crop Care", icon: "/assets/Dashboardicons/cropcare.svg", path: "/crop-care" },
    { title: "Soil Detects", icon: "/assets/Dashboardicons/soilDetects.svg", path: "/soil-detects" },
    { title: "Weather", icon: "/assets/Dashboardicons/weather.svg", path: "/weather" },
    { title: "Analytics", icon: "/assets/Dashboardicons/analysis.svg", path: "/analytics" },
    { title: "Community", icon: "/assets/Dashboardicons/community.svg", path: "/community" },
    { title: "Help & Support", icon: "/assets/Dashboardicons/help.svg", path: "/help-and-support" },
    { title: "Settings", icon: "/assets/Dashboardicons/settings.svg", path: "/settings" },
    { title: "Logout", icon: "/assets/Dashboardicons/Logout.svg", path: "/" }
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
    <NavLink
      to={link.path}
      key={index}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md transition ${
          isActive
            ? "bg-green-100 text-green-700 font-semibold"
            : "text-gray-700 hover:bg-green-100"
        }`
      }
    >
      <img className="w-5 h-5" src={link.icon} alt={`${link.title} icon`} />
      <span className="text-sm">{link.title}</span>
    </NavLink>
  ))}
</nav>
    </aside>
  );
};

export default SideBar;
