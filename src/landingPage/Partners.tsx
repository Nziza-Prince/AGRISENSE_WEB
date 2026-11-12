const partners = [
  {
    name: "RAB",
    fullName: "Rwanda Agriculture Board",
    logo: "/assets/partners/rab.webp",
  },
  {
    name: "MINAGRI",
    fullName: "Ministry of Agriculture",
    logo: "/assets/partners/minagri.png",
  },
  {
    name: "FAO",
    fullName: "Food & Agriculture Organization",
    logo: "/assets/partners/fao.svg",
  },
  {
    name: "RCA",
    fullName: "Rwanda Coding Academy",
    logo: "/assets/partners/rca.webp",
  },
  {
    name: "MOYA",
    fullName: "Ministry of Youth & Arts",
    logo: "/assets/partners/moya.svg",
  },
] as const;

const Partners = () => {
  return (
    <section className="border-y border-[#d7e8de] bg-[#f7fbf8] py-14 px-4 sm:px-8 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2C6E49]">
            Trusted partners
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#0B6E4F] sm:text-4xl">
            Our Partners
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Working with institutions that strengthen agriculture, youth, and digital innovation in Rwanda.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#dce9e1] bg-white px-4 py-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-transform duration-300 hover:-translate-y-0.5"
              title={partner.fullName}
            >
              <img
                src={partner.logo}
                alt={`${partner.name} official logo`}
                className="h-20 w-auto max-w-[140px] object-contain"
                loading="lazy"
              />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{partner.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                  {partner.fullName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
