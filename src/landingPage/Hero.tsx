// components/HeroSection.tsx
import { useState } from 'react';
import HeroImage from '../assets/HeroImage.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import FilterBar from './HeroFooter';

export default function HeroSection() {

  const [position,setPosition]  = useState('bottom')

  return (
    <div className="bg-cover flex flex-col pt-36 text-center bg-center h-[400px] w-full" style={{ backgroundImage: `url(${HeroImage})` }}>
    <div className='mb-20'>
      <h1 className="text-white mb-8 text-4xl  font-extrabold">Revolutionizing Agriculture</h1>
      <p className='font-semibold text-2xl text-white'>Empowering users with AGRISENSE app for sustainable farming</p>
    </div>
     {/* Foot of the Hero */}
    <FilterBar/>
     {/* Foot of the Hero */}
  </div>
  );
}
