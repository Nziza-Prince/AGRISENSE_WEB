import { useState } from "react";
import Logo from "/assets/logo.png";
import { Button } from "@/components/ui/button";
import ToggleMenuIcon from "./Hambagur";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { title: "Home", href: "#home" },
    { title: "About us", href: "#about" },
    { title: "Services", href: "#services" },
    { title: "Blogs", href: "#blogs" },
    { title: "Contact", href: "#contact" },
  ];

  return (
    <div className="border-b shadow-xl relative z-50 bg-white">
      <nav className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4">
        <a href="#home">
          <img className="h-16" src={Logo || "/placeholder.svg"} alt="Logo" />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex md:gap-6 lg:gap-12 items-center">
          {navItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="font-bold text-gray-600 hover:text-green-700 transition whitespace-nowrap"
            >
              {item.title}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link to="/dashboard">
            <Button className="bg-[#2C6E49] hover:bg-green-900 px-4 lg:px-6 py-2 font-bold text-white whitespace-nowrap">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <ToggleMenuIcon isOpen={menuOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile Links Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white flex flex-col items-start gap-4 px-6 py-4 md:hidden shadow-lg border-t z-50">
          {navItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="font-bold text-gray-600 hover:text-green-700"
            >
              {item.title}
            </a>
          ))}
          <Link to="/dashboard" className="w-full">
            <Button className="bg-[#2C6E49] hover:bg-green-900 px-6 py-2 font-bold text-white w-full">
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
