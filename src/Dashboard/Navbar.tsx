
const Navbar = () => {
  return (
    <header className="flex items-center justify-between px-6 py-2 bg-white border-b shadow-sm w-full">
      
      {/* Search Input */}
      <div className="flex-grow max-w-md">
        <input
          type="text"
          placeholder="🔍 Search..."
          className="w-full px-4 py-2 rounded-md border bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Notification + Profile */}
      <div className="flex items-center gap-6 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <img src="/assets/Dashboardicons/notification.svg" alt="Notification" className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#377552] rounded-full"></span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l pl-4">
          <img
            src="/assets/Dashboardicons/profile.png "
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-sm font-semibold">Chance Regine</h2>
            <p className="text-xs text-gray-500">chanceregine4@gmail.com</p>
          </div>
          <img src="/assets/arrow-down.svg" alt="Dropdown" className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
