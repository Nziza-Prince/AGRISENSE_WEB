import { Link } from "react-router-dom"
import { ArrowRight, PlayCircle, Sparkles, Leaf, CloudSun, LineChart, ShieldCheck } from "lucide-react"
import HeroImage from "/assets/HeroImage.png"
import FilterBar from "./HeroFooter"
import { useGetStarted } from "@/hooks/useGetStarted"

const HIGHLIGHTS = [
    { icon: Leaf, label: "AI Soil Analysis" },
    { icon: CloudSun, label: "Live Weather" },
    { icon: LineChart, label: "Yield Insights" },
]

const STATS = [
    { value: "60+", label: "Farmers onboarded" },
    { value: "25+", label: "Farms monitored" },
    { value: "5", label: "Districts reached" },
]

export default function HeroSection() {
    const { to: ctaTo, label: ctaLabel } = useGetStarted()
    return (
        <div className="relative mb-48 sm:mb-56 md:mb-64 lg:mb-56 w-full">
            <div className="relative min-h-[600px] sm:min-h-[640px] w-full flex flex-col overflow-hidden">
                <img
                    src={HeroImage}
                    alt="Rwandan farmers in the field using AgriSense smart farming tools"
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                    width={1920}
                    height={1080}
                />
                {/* Brand gradient overlay for legibility + cohesion */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#052e1a]/85 via-[#0b3d24]/70 to-[#0b6e4f]/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Decorative blur accents */}
                <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
                <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-12 lg:px-20 pt-24 pb-40 sm:pb-44 max-w-6xl mx-auto w-full">
                    {/* Eyebrow badge */}
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-lime-300" />
                        <span className="text-sm font-medium text-white/90">AgriSense Rwanda Smart Farming Platform</span>
                    </div>

                    {/* Headline */}
                    <h1 className="mt-6 max-w-3xl text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] text-white">
                        Grow smarter with{" "}
                        <span className="relative whitespace-nowrap text-lime-300">
                            AgriSense
                            <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-lime-300/60" />
                        </span>
                    </h1>

                    <p className="mt-5 max-w-2xl text-base sm:text-xl text-white/85 leading-relaxed">
                        Turn real-time soil, weather, and crop data into confident decisions with
                        AgriSense Rwanda. AgriSense helps farmers across Rwanda boost yields, cut
                        waste, and farm sustainably from one smart dashboard.
                    </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              to={ctaTo}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 font-bold text-[#0b3d24] shadow-lg shadow-lime-500/25 transition-all hover:bg-lime-300 hover:-translate-y-0.5"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15"
            >
              <PlayCircle className="h-4 w-4" />
              See How It Works
            </a>
          </div>

                    {/* Feature highlights */}
                    <div className="mt-8 flex flex-wrap gap-3">
                        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm border border-white/10"
                            >
                                <Icon className="h-4 w-4 text-lime-300" />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Trust stats */}
                    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                        {STATS.map((s) => (
                            <div key={s.label} className="flex flex-col">
                                <span className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</span>
                                <span className="text-sm text-white/70">{s.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 text-white/80">
                            <ShieldCheck className="h-5 w-5 text-lime-300" />
                            <span className="text-sm font-medium">Secure &amp; data-private</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search / filter bar overlapping the bottom */}
            <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 px-2 sm:px-4 z-20">
                <FilterBar />
            </div>
        </div>
    )
}
