import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 2,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 3,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 4,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 5,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 6,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
    rating: 5
  },
  {
    id: 7,
    name: "Chance Regine",
    isVerified: true,
    image: "/assets/testimony.png",
    text: "I am thrilled with the AI-based soil analysis technology! The AI-based soil analysis helped me choose the right crops, and the real-time monitoring has given me insights into unexpected storms. I've seen a 30% increase in my yields. Highly recommend!",
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
        <div className="flex items-center justify-center mb-8">
          <button 
            onClick={() => scroll('left')}
            className="p-2 mr-4 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">What Clients Say !</h2>
          <button 
            onClick={() => scroll('right')}
            className="p-2 ml-4 rounded-full hover:bg-gray-200 transition-colors"
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
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{testimonial.name}</span>
                    {testimonial.isVerified && (
                      <span className="ml-1 text-yellow-500">✓</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">{testimonial.text}</p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full mx-1 ${
                      i < testimonial.rating ? 'bg-[#0a7c42]' : 'bg-gray-300'
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