import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Eye,
  Sprout,
  Users,
  Building2,
  Store,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer";
import { useGetStarted } from "@/hooks/useGetStarted";
import AboutUsImage from "/assets/about-us-team.png";
import FarmerImage from "/assets/who-we-serve-farmer.png";

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    text: "We turn AI and real-time data into practical tools any farmer can use.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    text: "We help grow more with less — protecting soil, water, and livelihoods.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    text: "Accurate insights and secure handling of the data our users rely on.",
  },
  {
    icon: HeartHandshake,
    title: "Community",
    text: "We connect farmers, suppliers, and institutions to grow together.",
  },
];

const audiences = [
  { icon: Sprout, title: "Farmers", text: "Crop, soil, and weather intelligence to boost yields and cut risk." },
  { icon: Store, title: "Suppliers", text: "Reach more buyers and manage inventory and orders in one place." },
  { icon: Building2, title: "Government", text: "Regional insights and program tools for food-security decisions." },
  { icon: Users, title: "NGOs", text: "Measure impact and coordinate support across communities." },
];

const stats = [
  { value: "60+", label: "Farmers onboarded" },
  { value: "120", label: "Hectares covered" },
  { value: "5+", label: "Suppliers connected" },
  { value: "5", label: "Team members" },
];

const DEFAULT_AVATAR = "/assets/team/default-avatar.svg";

const team = [
  {
    name: "IRASUBIZA SALY NELSON",
    role: "CEO",
    focus: "Founder & Chief Executive Officer",
    phone: "+250 798 863 223",
    email: "irasubizasalynelson@gmail.com",
    photo: DEFAULT_AVATAR,
  },
  {
    name: "NKOTANYI PRINCE NZIZA",
    role: "CTO",
    focus: "DevOps & Backend",
    phone: "+250 796 334 656",
    email: "nzizaprince7@gmail.com",
    photo: DEFAULT_AVATAR,
  },
  {
    name: "RAPHAEL NIBISHAKA",
    role: "Head of Engineering",
    focus: "Co-Founder & Full Stack Engineer",
    phone: "+250 792 672 810",
    email: "raphaelnibishaka@gmail.com",
    photo: DEFAULT_AVATAR,
  },
  {
    name: "IMPANO UMUHOZA HOPE",
    role: "CMO",
    focus: "Marketing & Growth",
    phone: "+250 781 375 716",
    email: "umuhozahope5@gmail.com",
    photo: DEFAULT_AVATAR,
  },
  {
    name: "IBIJURU CHANCE REGINE",
    role: "CFO",
    focus: "Finance & Operations",
    phone: "",
    email: "",
    photo: DEFAULT_AVATAR,
  },
];

const leadership = team.slice(0, 3);
const support = team.slice(3);

const AboutPage = () => {
  const { to: ctaTo, label: ctaLabel } = useGetStarted();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B6E4F] via-[#2C6E49] to-[#14532d] text-white">
        <div className="absolute -top-16 -right-10 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Leaf className="h-4 w-4 text-lime-300" /> About AgriSense
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            Growing a smarter, more sustainable future for African agriculture
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            AgriSense Rwanda bridges technology and agriculture, delivering AI-powered insights
            that help farmers, suppliers, governments, and NGOs make better decisions every
            season.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C6E49]/10 text-[#2C6E49]">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-3 text-gray-600">
              To empower every farmer with accessible, data-driven insights — connecting technology
              with agriculture to increase productivity, resilience, and income across the value
              chain.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C6E49]/10 text-[#2C6E49]">
              <Eye className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
            <p className="mt-3 text-gray-600">
              A future where data-driven farming is the norm — where climate-smart decisions protect
              the land, strengthen food security, and lift communities out of poverty.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-[#f0f7f4] py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 lg:gap-16">
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img
                src={AboutUsImage}
                alt="AgriSense team in the field"
                className="h-64 w-full object-cover object-[center_25%] sm:h-72 md:h-96"
              />
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-xl bg-[#2C6E49] px-4 py-3 text-white shadow-lg sm:block">
              <p className="text-xl font-bold">120</p>
              <p className="text-xs text-white/80">Hectares covered</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#2C6E49]">Our Story</h2>
            <p className="mt-4 text-gray-700">
              AgriSense was born from a simple observation: farmers make some of the most important
              decisions of their lives with too little information. Weather is unpredictable, soil
              conditions vary field to field, and market access is uneven.
            </p>
            <p className="mt-3 text-gray-700">
              We set out to change that. By combining AI with real-time weather, soil, and market
              data, AgriSense turns complexity into clear, actionable guidance — accessible from any
              device, in the field or at home.
            </p>
            <p className="mt-3 text-gray-700">
              Today we serve a growing network of farmers, suppliers, and institutions, and we're
              only getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">What We Stand For</h2>
          <p className="mt-3 text-gray-600">
            The values that guide how we build products and serve our community.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C6E49]/10 text-[#2C6E49]">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{v.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact stats */}
      <section className="bg-[#2C6E49] py-14 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 text-center lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-white/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-gray-100 bg-[#f7faf8] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2C6E49]">
              Leadership
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Our Team</h2>
            <p className="mt-3 text-gray-600">
              The people behind AgriSense — building practical tools for Rwandan farmers.
            </p>
          </div>

          {/* Top row: CEO, CTO, Head of Engineering */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>

          {/* Bottom row: CMO + CFO, centered */}
          <div className="mx-auto mt-6 grid max-w-3xl gap-6 sm:grid-cols-2">
            {support.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Who We Serve</h2>
            <p className="mt-3 text-gray-600">
              One platform, tailored insights for every part of the agricultural ecosystem.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {audiences.map((a) => (
                <div key={a.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2C6E49]/10 text-[#2C6E49]">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-600">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <img
              src={FarmerImage}
              alt="Farmers growing crops with AgriSense"
              className="h-64 w-full object-cover object-center sm:h-72 md:h-80"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-5 pb-4 pt-10">
              <p className="text-sm font-semibold text-white">Built for farmers first</p>
              <p className="text-xs text-white/80">Practical tools for fields across Rwanda</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B6E4F] to-[#14532d] px-8 py-14 text-center text-white shadow-2xl md:px-16">
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold md:text-4xl">
            Ready to farm smarter with AgriSense?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/90">
            Join early farmers and partners already using AgriSense to grow more, waste less, and
            build resilient livelihoods.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={ctaTo}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-3.5 font-bold text-[#0b3d24] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-lime-300"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/#waitlist"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;

type TeamMember = (typeof team)[number];

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#e8f0eb] bg-[#e8f0eb] shadow-sm">
          <img
            src={member.photo}
            alt={member.name}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>

        <h3 className="mt-5 min-h-[2.5rem] text-sm font-bold uppercase leading-snug tracking-wide text-gray-900">
          {member.name}
        </h3>

        <span className="mt-2 inline-flex items-center rounded-md bg-[#2C6E49] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {member.role}
        </span>

        <p className="mt-2 min-h-[1rem] text-xs text-gray-500">{member.focus}</p>
      </div>

      <div className="mt-auto border-t border-gray-100 bg-[#f9fbfa] px-5 py-4">
        {member.email || member.phone ? (
          <div className="space-y-2.5">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2.5 text-sm text-gray-600 transition-colors hover:text-[#2C6E49]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2C6E49] shadow-sm ring-1 ring-gray-100">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 truncate">{member.email}</span>
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2.5 text-sm text-gray-600 transition-colors hover:text-[#2C6E49]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2C6E49] shadow-sm ring-1 ring-gray-100">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span>{member.phone}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-gray-400">Contact details coming soon</p>
        )}
      </div>
    </article>
  );
}
