import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, BadgeCheck } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  isVerified: boolean;
  image: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Jean de Dieu",
    isVerified: true,
    image: "/assets/testimonials/profile1.webp",
    text: "The AI-based soil analysis helped me choose the right crops for my land. I've seen a 30% increase in my potato yields this season. Highly recommend AgriSense!",
    rating: 5
  },
  {
    id: 2,
    name: "Alice Mutoni",
    isVerified: true,
    image: "/assets/testimonials/profile2.webp",
    text: "The real-time weather monitoring has been a lifesaver. I received an alert about an unexpected storm just in time to protect my seedlings. Truly remarkable technology.",
    rating: 5
  },
  {
    id: 3,
    name: "David Mugisha",
    isVerified: true,
    image: "/assets/testimonials/profile3.webp",
    text: "Accessing daily market prices through AgriSense has completely changed how I sell my produce. I now get much better deals and don't lose money to middlemen.",
    rating: 4
  },
  {
    id: 4,
    name: "Solange Uwera",
    isVerified: true,
    image: "/assets/testimonials/profile4.webp",
    text: "AgriSense's crop management tools simplified my daily farming tasks. The customized schedule for my maize farm has improved my efficiency significantly.",
    rating: 5
  },
  {
    id: 5,
    name: "Emmanuel Nkurunziza",
    isVerified: true,
    image: "/assets/testimonials/profile1.webp",
    text: "I was skeptical about AI in farming, but AgriSense proved me wrong. The insights provided are incredibly accurate and easy to understand even for local farmers.",
    rating: 5
  },
  {
    id: 6,
    name: "Grace Ishimwe",
    isVerified: true,
    image: "/assets/testimonials/profile2.webp",
    text: "Being part of the AgriSense community has given me access to expert advice that I couldn't afford before. It's more than just an app; it's a support system.",
    rating: 5
  },
  {
    id: 7,
    name: "Patrick Habimana",
    isVerified: true,
    image: "/assets/testimonials/profile3.webp",
    text: "The pest detection feature saved my tomato crop this year. I identified the issue early and used organic solutions suggested by the platform. Excellent tool!",
    rating: 5
  }
];

const TestimonialCarousel: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300; // Adjust scroll amount as needed

      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="py-12 px-4 bg-[#f0f7f4]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-10">
          <button
            onClick={() => scroll('left')}
            className="p-2 mr-6 rounded-full hover:bg-white hover:shadow-md transition-all bg-[#0a7c42]/10 text-[#0a7c42] border border-transparent hover:border-[#0a7c42]/20"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">What Clients Say</h2>
          <button
            onClick={() => scroll('right')}
            className="p-2 ml-6 rounded-full hover:bg-white hover:shadow-md transition-all bg-[#0a7c42]/10 text-[#0a7c42] border border-transparent hover:border-[#0a7c42]/20"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-shrink-0 px-6 py-6 font-medium w-[280px] bg-white p-4 rounded-lg shadow-sm"
            >
              <div className="flex items-center mb-3">
                <img
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{testimonial.name}</span>
                    {testimonial.isVerified && (
                      <BadgeCheck className="ml-1 h-4 w-4 text-[#0a7c42]" aria-label="Verified" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div className="flex items-center gap-0.5 mt-auto">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={`${
                      i < testimonial.rating ? 'fill-[#0a7c42] text-[#0a7c42]' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
