import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { routes } from "@/lib/routes";

/**
 * Mirrors the backend billing rules (backend/src/billing/billing.enums.ts):
 * one free analysis per farm per season, then a 20,000 RWF season pass per farm,
 * paid by mobile money and confirmed by an admin. Keep these in sync.
 */
const SEASON_PASS_PRICE_RWF = 20000;

interface Plan {
  id: "free" | "season" | "partners";
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    title: "First analysis free",
    description: "Try AgriSense on your own farm before you pay anything.",
    price: "Free",
    priceNote: "One analysis per farm, each season",
    features: [
      "Register your farm and its location",
      "Soil and crop analysis with recommendations",
      "Local weather for your farm",
      "No payment details needed",
    ],
  },
  {
    id: "season",
    title: "Season pass",
    description: "Keep getting recommendations for one farm all season.",
    price: `RWF ${SEASON_PASS_PRICE_RWF.toLocaleString("en-US")}`,
    priceNote: "Per farm, per season",
    features: [
      "Repeat soil and crop analyses for the season",
      "Weather and pest alerts for your farm",
      "Pay by mobile money (MTN MoMo)",
      "Your payment is confirmed by our team",
    ],
    popular: true,
  },
  {
    id: "partners",
    title: "Cooperatives & programs",
    description: "For cooperatives, suppliers, NGOs and government programs.",
    price: "Let's talk",
    priceNote: "Arranged to fit your program",
    features: [
      "Support for many farmers and farms",
      "Regional views of farm data",
      "Onboarding help for your members",
    ],
  },
];

const PriceCards = () => {
  const { isAuthenticated } = useAuth();

  const resolveCta = (plan: Plan) => {
    if (plan.id === "partners") {
      return {
        label: "Contact us",
        to: routes.contact,
        state: { subject: "Cooperative or program enquiry" },
      };
    }
    return {
      label: isAuthenticated ? "Open my dashboard" : "Create a free account",
      to: isAuthenticated ? routes.app.subscription : routes.auth.register,
      state: undefined,
    };
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const cta = resolveCta(plan);
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 text-left transition-all ${
                plan.popular
                  ? "border-[#2C6E49] shadow-2xl lg:-translate-y-2"
                  : "border-gray-200 shadow-sm hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#2C6E49] px-3 py-1 text-xs font-semibold text-white shadow">
                  <Sparkles className="h-3.5 w-3.5" /> For continued use
                </span>
              )}

              <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
              <p className="mt-1.5 min-h-[40px] text-sm text-gray-500">{plan.description}</p>

              <div className="mt-5">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <p className="mt-1 text-xs text-gray-500">{plan.priceNote}</p>
              </div>

              <Link
                to={cta.to}
                state={cta.state}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 font-semibold transition-colors ${
                  plan.popular
                    ? "bg-[#2C6E49] text-white hover:bg-[#23583a]"
                    : "border border-[#2C6E49] text-[#2C6E49] hover:bg-[#2C6E49]/5"
                }`}
              >
                {cta.label}
              </Link>

              <div className="mt-8 border-t pt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  What&apos;s included
                </p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2C6E49]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Prices in Rwandan francs (RWF) · No card needed · No automatic renewals
      </p>
    </div>
  );
};

export default PriceCards;
