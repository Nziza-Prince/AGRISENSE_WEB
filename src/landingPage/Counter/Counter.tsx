import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface ContentType {
  image: string;
  count: number;
  description: string;
}

const Counter = () => {
  const contents: ContentType[] = [
    { image: '/assets/counter/HappyCustomer.svg',
     count: 832,
     description: 'Happy Customers',
   },
   {
     image: '/assets/counter/completedProjects.svg',
     count: 45,
     description: 'Completed Projects',
   },
   {
     image: '/assets/counter/yearsOfExperience.svg',
     count: 42,
     description: 'Years of Experience',
   },
   {
     image: '/assets/counter/professionalTeam.svg',
     count: 25,
     description: 'Professional Team ',
   },
 ]
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <div
      ref={ref}
      className="mt-16 bg-[#377552] text-white py-12 px-4 sm:px-8 lg:px-20"
    >
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 justify-center items-center text-center">
        {contents.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-2 px-4"
          >
            <img
              src={item.image}
              alt={item.description}
              className="w-12 h-14 md:w-14 md:h-14"
            />
            <h1 className="text-2xl md:text-3xl font-bold">
              {inView ? <CountUp end={item.count} duration={1} /> : 0}+
            </h1>
            <p className="text-sm md:text-base">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Counter;
