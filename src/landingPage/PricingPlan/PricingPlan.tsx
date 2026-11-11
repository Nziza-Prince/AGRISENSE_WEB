
import PriceCards from './PriceCards';



const PricingPlan = () => {
  return (
    <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-24 xl:px-40 text-center">
      <div className="mx-auto max-w-2xl">
        <span className="inline-block rounded-full bg-[#2C6E49]/10 px-4 py-1.5 text-sm font-semibold text-[#2C6E49]">
          Pricing
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900">
          Simple pricing, paid per farm
        </h2>
        <p className="mt-3 text-gray-600">
          Your first analysis on each farm is free. After that, one season pass covers that farm for the season.
        </p>
      </div>

      <div className="mt-12">
        <PriceCards />
      </div>
    </section>
  );
};

export default PricingPlan;
