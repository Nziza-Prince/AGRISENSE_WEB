import { useState } from 'react'
import Logo from '../../assets/logo.png'
import { Button } from '@/components/ui/button'
import ToggleMenuIcon from './Hambagur'

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className='border-b  shadow-xl'>
      <nav className='flex items-center justify-between px-6 md:px-20 py-4'>
        <img className='h-16' src={Logo} alt="Logo" />

        {/* Desktop Links */}
        <div className='hidden md:flex gap-12 items-center'>
          <a className='font-bold text-gray-600' href="#">Home</a>
          <a className='font-bold text-gray-600' href="#">About us</a>
          <a className='font-bold text-gray-600' href="#">Services</a>
          <a className='font-bold text-gray-600' href="#">Blogs</a>
          <a className='font-bold text-gray-600' href="#">Contact</a>
        </div>

        {/* CTA Button */}
        <div className='hidden md:block'>
          <Button className='bg-[#2C6E49] px-6 py-2 font-bold text-white'>Get Started</Button>
        </div>

        {/* Mobile Menu Icon */}
        <div className='md:hidden'>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            <ToggleMenuIcon isOpen={menuOpen}/>
          </button>
        </div>
      </nav>

      {/* Mobile Links Dropdown */}
      {menuOpen && (
        <div className='flex flex-col items-start gap-4 px-6 pb-4 md:hidden'>
          <a className='font-bold text-gray-600' href="#">Home</a>
          <a className='font-bold text-gray-600' href="#">About us</a>
          <a className='font-bold text-gray-600' href="#">Services</a>
          <a className='font-bold text-gray-600' href="#">Blogs</a>
          <a className='font-bold text-gray-600' href="#">Contact</a>
          <Button className='bg-[#2C6E49] px-6 py-2 font-bold text-white w-full'>Get Started</Button>
        </div>
      )}
    </div>
  )
}

export default Navbar
