import DashboardLayout from "./DashboardLayout"
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  Search,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';

import { CONTACT } from '@/lib/contact';

const SUPPORT_EMAIL = CONTACT.email;
const SUPPORT_PHONE = CONTACT.phoneDisplay;
const SUPPORT_PHONE_TEL = CONTACT.phoneTel;

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: 'How do I add a farm?',
    a: 'Go to Settings → Farm Management → Add Farm. Fill in the farm details (name, size, soil type and location) and save. Your farms then appear across the dashboard, weather and crop care pages.',
  },
  {
    q: 'How does crop care work?',
    a: 'Open Crop Care to see recommendations for your farms. Add farm details in Settings, then use weather and field insights to guide planting, fertilizer and irrigation decisions.',
  },
  {
    q: 'Where does the weather data come from?',
    a: 'Live weather is provided by Open-Meteo based on your selected farm location (or your device location). It powers the Weather page forecasts and the smart farming advisories.',
  },
  {
    q: 'I forgot my password. What do I do?',
    a: 'On the Sign In page click "Forgot password?", enter your email, then use the 6-digit code sent to your inbox to set a new password.',
  },
  {
    q: 'How do I verify my email?',
    a: 'After signing up we email you a 6-digit code. Enter it on the verification screen. You can resend the code if it expires.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Sessions use short-lived access tokens kept in memory, automatic token refresh, idle auto-logout, and all inputs are validated and sanitised on the client in addition to server-side checks.',
  },
  {
    q: 'How do I post in the community?',
    a: 'Open the Community page, write your message (optionally add an image URL) and click Post. You can like and comment on other farmers’ posts too.',
  },
];

const HelpandSupport = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Help & Support | AGRISENSE';
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [query]);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent('AgriSense Support Request');
    const body = encodeURIComponent(
      `${message}\n\n---\nFrom: ${user?.username || 'user'} (${user?.email || 'unknown'})`,
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, [message, user]);

  return (
    <DashboardLayout>

        <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0B6E4F]">Help &amp; Support</h1>
            <p className="text-gray-500 text-sm mt-1">
              Find answers fast or reach out to our team.
            </p>
          </div>

          {/* Account summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your account</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Info label="Username" value={user?.username || '—'} />
              <Info label="Email" value={user?.email || '—'} />
              <div>
                <p className="text-xs text-gray-500">Email status</p>
                {user?.isEmailVerified ? (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mt-0.5">
                    <BadgeCheck className="h-4 w-4" /> Verified
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 mt-0.5">
                    <ShieldAlert className="h-4 w-4" /> Not verified
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FAQ */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles…"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50/60 pl-11 pr-4 outline-none focus:bg-white focus:border-[#2C6E49] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <Card className="border shadow-sm">
                <CardContent className="p-0 divide-y">
                  {filtered.length === 0 ? (
                    <EmptyState art="search" title="Let us help with that" text="Try other words, or contact support below." compact />
                  ) : (
                    filtered.map((faq, i) => (
                      <div key={faq.q}>
                        <button
                          onClick={() => setOpenIndex(openIndex === i ? null : i)}
                          className="w-full flex items-center justify-between text-left px-5 py-4 hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-800">{faq.q}</span>
                          <ChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              openIndex === i ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {openIndex === i && (
                          <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Contact us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <Mail className="h-5 w-5 text-[#2C6E49]" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-gray-500">{SUPPORT_EMAIL}</p>
                    </div>
                  </a>
                  <a
                    href={`tel:${SUPPORT_PHONE_TEL}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <Phone className="h-5 w-5 text-[#2C6E49]" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-xs text-gray-500">{SUPPORT_PHONE}</p>
                    </div>
                  </a>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Send a message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Describe your issue…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm outline-none focus:bg-white focus:border-[#2C6E49] resize-none"
                  />
                  <a
                    href={message.trim() ? mailtoHref : undefined}
                    aria-disabled={!message.trim()}
                    className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl font-semibold text-white text-sm transition-colors ${
                      message.trim()
                        ? 'bg-[#2C6E49] hover:bg-[#23583a]'
                        : 'bg-gray-300 pointer-events-none'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" /> Send to support
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{value}</p>
    </div>
  );
}

export default HelpandSupport;
