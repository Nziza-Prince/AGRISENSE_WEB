import HeroImage from '/assets/HeroImage.png'
import FilterBar from './HeroFooter';


export default function HeroSection() {
  return (
    <div className="mb-36 sm:mb-36 md:mb-36 bg-cover flex flex-col pt-36 text-center bg-center h-[400px] w-full" style={{ backgroundImage: `url(${HeroImage})` }}>
   {/* Hero Section */}
    
      <div className='mb-20'>
        <h1 className="text-white mb-8 text-4xl  font-extrabold">Revolutionizing Agriculture</h1>
        <p className='font-semibold text-2xl text-white'>Empowering users with AGRISENSE app for sustainable farming</p>
      </div>
       {/* Foot of the Hero */}
      <FilterBar/>
  </div>
  );
}
