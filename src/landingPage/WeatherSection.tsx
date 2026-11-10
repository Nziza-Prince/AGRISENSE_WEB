import { Link } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { formatWeatherLocation, getFarmingAdvisories } from "@/lib/weather";
import WeatherIcon from "@/components/WeatherIcon";

const WeatherSection = () => {
  // Always prefer the visitor's device GPS (sector / cell level when available).
  const { weather, loading } = useWeather({
    useGeolocation: true,
    preferDevice: true,
  });
  const advisories = weather ? getFarmingAdvisories(weather).slice(0, 3) : [];

  return (
    <div className="mx-auto mb-20 mt-36 flex max-w-6xl flex-col items-center px-4 md:px-6">
      <div className="flex w-full flex-col items-center gap-8 md:flex-row-reverse md:gap-12">
        <div className="w-full md:w-1/2 lg:w-5/12">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B6E4F] to-[#14532d] p-6 text-white shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10">
                <Loader2 className="h-6 w-6 animate-spin" /> Locating your device…
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {formatWeatherLocation(weather.location)}
                    </p>
                    <p className="mt-1 text-5xl font-bold">
                      {Math.round(weather.current.temperature)}°C
                    </p>
                    <p className="text-white/90">{weather.current.label}</p>
                  </div>
                  <WeatherIcon category={weather.current.category} className="h-16 w-16" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {weather.daily.slice(1, 4).map((d) => (
                    <div key={d.date} className="rounded-lg bg-white/10 py-2">
                      <p className="text-xs text-white/70">
                        {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <WeatherIcon category={d.category} className="mx-auto my-1 h-5 w-5" />
                      <p className="text-sm font-semibold">{Math.round(d.tempMax)}°</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <img
                className="w-full rounded-lg object-cover"
                src="/assets/WeatherMan.webp"
                loading="lazy"
                decoding="async"
                alt="Weather forecast"
              />
            )}
          </div>
        </div>

        <div className="w-full text-left md:w-1/2 lg:w-7/12">
          <h2 className="mb-6 text-xl font-bold text-[#0a7c42]">Weather Updates:</h2>
          <div className="mb-8 flex flex-col gap-5">
            {advisories.length > 0 ? (
              advisories.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <img src="/assets/smartFarmingIcon.svg" alt="" className="mt-1 h-5 w-5" />
                  <p className="font-medium">
                    <span className="font-semibold">{a.title}:</span> {a.detail}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <img src="/assets/smartFarmingIcon.svg" alt="" className="mt-1 h-5 w-5" />
                  <p className="font-medium">Real-time rainfall & irrigation guidance for your region.</p>
                </div>
                <div className="flex items-start gap-3">
                  <img src="/assets/smartFarmingIcon.svg" alt="" className="mt-1 h-5 w-5" />
                  <p className="font-medium">Drought and heat alerts with recommended actions.</p>
                </div>
                <div className="flex items-start gap-3">
                  <img src="/assets/smartFarmingIcon.svg" alt="" className="mt-1 h-5 w-5" />
                  <p className="font-medium">Frost warnings to protect your sensitive crops.</p>
                </div>
              </>
            )}
          </div>
          <Link
            to="/app/weather"
            className="inline-block rounded-md bg-[#0a7c42] px-8 py-2 font-medium text-white hover:bg-[#086835]"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;
