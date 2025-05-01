// components/HeroSection.tsx
import HeroImage from '../assets/HeroImage.png'

export default function HeroSection() {
  return (
    <div className="bg-cover flex flex-col pt-36 text-center bg-center h-[400px] w-full" style={{ backgroundImage: `url(${HeroImage})` }}>
    <h1 className="text-white mb-8 text-4xl  font-extrabold">Revolutionizing Agriculture</h1>
    <p className='font-semibold text-2xl text-white'>Empowering users with AGRISENSE app for sustainable farming</p>

  </div>
  );
}
