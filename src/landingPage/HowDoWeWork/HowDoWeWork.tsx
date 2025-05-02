import React from 'react';

interface WordType {
  title: string;
  description: string;
}

const words: WordType[] = [
  {
    title: 'Soil & Weather Analysis',
    description:
      'AgriSense uses AI to assess soil health, pH levels, moisture, and nutrient content while analyzing weather conditions like rainfall and temperature to optimize farming decisions.',
  },
  {
    title: 'Crop Recommendations',
    description:
      'AI algorithms suggest the best crops based on soil type, season, and market demand, boosting productivity and profitability for farmers.',
  },
  {
    title: 'Irrigation Scheduling',
    description:
      'Agrisense provides optimized irrigation plans based on real-time weather and soil moisture data, helping conserve water and improve yield.',
  },
  {
    title: 'Pest & Disease Alerts',
    description:
      'Real-time detection and alerts for pests and diseases help farmers take timely action, reducing crop damage and improving harvests.',
  },
];

const HowDoWeWork = () => {
  return (
    <div className="mb-56 flex flex-col items-center px-6">
      <h1 className="text-[#2C6E49] text-4xl font-bold mb-10 text-center">How Do We Work</h1>
      <p className="text-lg text-center max-w-3xl mb-20 font-medium text-gray-700">
        Agrisense leverages AI to provide crop recommendations, irrigation schedules, and pest alerts,
        helping farmers optimize and connect with suppliers.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-14 gap-y-16 w-full max-w-6xl">
        {words.map((word, index) => (
          <div key={index} className="flex items-start gap-4">
            <img src="/assets/icons/tick.svg" alt="tick" className="w-12 h-12 mt-2 " />
            <div>
              <h2 className="text-[#377552] text-xl font-bold mb-2">{word.title}</h2>
              <p className="text-gray-700 font-semibold">{word.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowDoWeWork;
