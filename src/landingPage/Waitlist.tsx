import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Users } from "lucide-react";
import { ApiError, waitlistService } from "@/api";
import { validateEmail } from "@/lib/validation";

const PERKS = [
  "Early access to new AI features",
  "Priority onboarding & support",
  "Exclusive launch pricing",
];

const Waitlist = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameError(null);
    setEmailError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError("Enter your full name.");
      return;
    }
    if (trimmedName.length > 120) {
      setNameError("Name must be 120 characters or fewer.");
      return;
    }

    const check = validateEmail(email);
    if (!check.valid) {
      setEmailError(check.message || "Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await waitlistService.join({
        fullName: trimmedName,
        email: email.trim().toLowerCase(),
        source: "landing-page",
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not join the waitlist. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full h-12 rounded-xl border bg-gray-50/60 px-4 outline-none transition-all focus:bg-white focus:ring-2 disabled:opacity-60 ${
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-gray-200 focus:border-[#2C6E49] focus:ring-green-100"
    }`;

  return (
    <section id="waitlist" className="px-4 sm:px-6 md:px-12 lg:px-20 py-16">
      <div className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B6E4F] via-[#2C6E49] to-[#14532d] px-6 sm:px-10 md:px-16 py-12 md:py-16 text-white shadow-2xl">
        <div className="absolute -top-16 -right-10 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-lime-300" />
              <span className="text-sm font-medium text-white/90">Join the movement</span>
            </div>

            <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold leading-tight">
              Be first to farm smarter with{" "}
              <span className="text-lime-300">AgriSense</span>
            </h2>
            <p className="mt-4 text-white/85 text-lg max-w-md">
              Join the AgriSense Rwanda early-access waitlist and get a welcome email with
              features, benefits, and next steps for smarter farming.
            </p>

            <ul className="mt-6 space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 text-white/90">
                  <CheckCircle2 className="h-5 w-5 text-lime-300 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl text-gray-800">
            {submitted ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-[#2C6E49]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">You&apos;re on the list</h3>
                <p className="text-gray-500 mt-2">
                  Thanks{fullName.trim() ? `, ${fullName.trim().split(" ")[0]}` : ""}. Check{" "}
                  <span className="font-semibold text-gray-700">{email}</span> for your
                  AgriSense welcome email.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900">Reserve your spot</h3>
                <p className="text-gray-500 text-sm mt-1">
                  No spam — just launch news and perks.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
                  <div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                      maxLength={120}
                      disabled={loading}
                      autoComplete="name"
                      className={inputClass(!!nameError)}
                    />
                    {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      autoComplete="email"
                      className={inputClass(!!emailError || !!error)}
                    />
                    {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full h-12 rounded-xl bg-[#2C6E49] hover:bg-[#23583a] text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Joining…
                      </>
                    ) : (
                      <>
                        Join the Waitlist
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Users className="h-4 w-4" />
                  Join early farmers already on the waitlist.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
