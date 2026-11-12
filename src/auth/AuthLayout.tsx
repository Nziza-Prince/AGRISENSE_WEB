import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "/assets/logo.png";
import HeroImage from "/assets/HeroImage.webp";
import SmartFarmingImage from "/assets/smartFarmingImage.webp";
import FarmerImage from "/assets/farmer.webp";
import WeatherImage from "/assets/WeatherMan.webp";
import { routes } from "@/lib/routes";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Kept for compatibility; layout no longer flips panels. */
  panel?: "login" | "register" | "center";
}

function pickAuthImage(pathname: string): string {
  if (pathname.includes("/register") || pathname.includes("/signup")) {
    return SmartFarmingImage;
  }
  if (pathname.includes("/forgot") || pathname.includes("/verify")) {
    return WeatherImage;
  }
  if (pathname.includes("/onboarding")) {
    return FarmerImage;
  }
  return HeroImage;
}

function pickAuthCaption(pathname: string): { headline: string; line: string } {
  if (pathname.includes("/register") || pathname.includes("/signup")) {
    return {
      headline: "Start your smart farm journey.",
      line: "Join farmers using AgriSense to grow with confidence.",
    };
  }
  if (pathname.includes("/forgot") || pathname.includes("/verify")) {
    return {
      headline: "We've got you covered.",
      line: "Secure account recovery and verification in a few steps.",
    };
  }
  return {
    headline: "Farm smarter, grow better.",
    line: "AI soil insights, weather intelligence, and community in one place.",
  };
}

const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  const { pathname } = useLocation();
  const isRegister = pathname.includes("/register") || pathname.includes("/signup");
  const topAction = isRegister
    ? { to: routes.auth.login, label: "Sign in" }
    : { to: routes.auth.register, label: "Sign up" };
  const sideImage = pickAuthImage(pathname);
  const caption = pickAuthCaption(pathname);

  return (
    <div className="flex min-h-dvh w-full flex-col lg:min-h-screen lg:flex-row lg:bg-[#F0F5F2]">
      {/* Desktop image panel — uses bundled app assets */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src={sideImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#052e1a]/80 via-[#0b3d24]/65 to-[#0b6e4f]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white xl:p-16">
          <Link
            to={routes.home}
            className="flex w-fit items-center gap-3 transition-opacity hover:opacity-90"
          >
            <img src={Logo} alt="AgriSense" className="h-11 w-11 object-contain drop-shadow" />
            <span className="text-2xl font-extrabold tracking-tight">
              AGRI<span className="text-lime-300">SENSE</span>
            </span>
          </Link>

          <div className="max-w-md space-y-3">
            <h2 className="text-4xl font-extrabold leading-tight drop-shadow-sm xl:text-5xl">
              {caption.headline}
            </h2>
            <p className="text-lg leading-relaxed text-white/85">{caption.line}</p>
          </div>

          <p className="text-sm text-white/60">
            &copy; {new Date().getFullYear()} AgriSense. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Form column */}
      <div className="relative flex min-h-dvh flex-1 flex-col lg:min-h-0 lg:items-center lg:justify-center lg:bg-[#F0F5F2] lg:p-10">
        {/* Mobile full-bleed photo (same asset family) */}
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <img
            src={sideImage}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#052e1a]/88 via-[#0b3d24]/78 to-[#0b6e4f]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20" />
        </div>

        <div className="relative z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <Link
            to={routes.home}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link
            to={topAction.to}
            className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm"
          >
            {topAction.label}
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-6 text-center text-white lg:hidden">
          <img
            src={Logo}
            alt=""
            className="mx-auto mb-4 h-16 w-16 object-contain drop-shadow-lg"
          />
          <p className="text-[2rem] font-extrabold tracking-tight drop-shadow-sm">
            AGRI<span className="text-lime-300">SENSE</span>
          </p>
          <p className="mx-auto mt-2 max-w-[22ch] text-[15px] leading-snug text-white/80">
            {caption.line}
          </p>
        </div>

        <div className="relative z-10 mb-6 hidden w-full max-w-md lg:block">
          <Link
            to={routes.home}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[#2C6E49]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <main className="relative z-10 w-full px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-md lg:px-0 lg:pb-0">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-6 lg:rounded-2xl lg:border lg:border-gray-100 lg:p-10 lg:shadow-[0_10px_40px_rgba(11,110,79,0.12)]">
            <div className="mb-5 lg:mb-8">
              <h1 className="text-[1.4rem] font-bold tracking-tight text-gray-900 lg:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footer ? (
              <div className="mt-5 text-center text-sm lg:mt-6">{footer}</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
