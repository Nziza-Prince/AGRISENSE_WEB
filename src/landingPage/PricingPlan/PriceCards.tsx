import { FaStar } from 'react-icons/fa';

const PriceCards = () => {

    const plans = [
      {
        title: 'Free Plan',
        price: '$0.00',
        benefits: [
          'Basic soil & crop analysis (limited)',
          'Pro Plan – $19.99/month',
          'Limited supplier connections',
        ],
        image: '/assets/pricing.png',
      },
      {
        title: 'Pro Plan',
        price: '$19.99',
        benefits: [
          'Unlimited soil & crop reports',
          'Real-time weather & pest alerts',
          'Supplier access & market insights',
        ],
        image: '/assets/pricing.png',
      },
      {
        title: 'Enterprise Plan',
        price: '$30.00',
        benefits: [
          'Nationwide agricultural data & reports',
          ' Disaster response & seed distribution ',
          ' Government & NGO collaboration tools',
        ],
        image: '/assets/pricing.png',
      },
    ];
  return (
    <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className="group bg-white border p-6 shadow-2xl hover:bg-[#377552] hover:text-white transition duration-600 cursor-pointer hover:border-white hover-shadow-[#2C6E49]"
          >
            <div className="mb-4 border-b-4 border-gray-600 group-hover:border-white  pb-4">
              <img
                src={plan.image}
                alt={plan.title}
                className="w-full h-40 object-cover rounded-lg mb-4 group-hover:brightness-75"
              />
              <h2 className="text-xl font-semibold  group-hover:text-white transition">
                {plan.title}
              </h2>
            </div>

            <div className="space-y-3 mt-10 pl-3 mb-10">
              {plan.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 text-left mb-6">
                  <FaStar className="text-2xl text-[#377552] group-hover:text-white mt-1 transition" />
                  <p className="text-gray-700 group-hover:text-white text-sm transition mt-1 font-medium">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-[#377552] group-hover:text-white transition">
                {plan.price}
              </span>
              <span className="text-gray-500 group-hover:text-white ml-1 text-sm transition font-semibold">/per month</span>
            </div>

            <button className="cursor-pointer bg-[#377552] w-full group-hover:bg-white group-hover:text-[#2C6E49] text-white py-2 px-4 rounded-md transition font-semibold">
              Check Plan
            </button>

            <p className="mt-4 text-sm text-gray-500 group-hover:text-white transition">
              Get 23% Save For Services
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PriceCards
