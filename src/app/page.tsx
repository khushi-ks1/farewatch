import Link from 'next/link'
import { Plane, Bell, ArrowRight, ShieldCheck, Zap, Sparkles, TrendingDown, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Flight Tracker for India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Never overpay for flights in India again.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Save your route, pick your dates, and set your target fare. FareWatch scans Google Flights every 30 minutes and emails you the moment a matching deal drops.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Tracking Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-base transition-colors text-center"
                >
                  Go to Dashboard
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Free multi-user alerts
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> 0% spam guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Instant booking links
                </span>
              </div>
            </div>

            {/* Right card preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl shadow-sky-600/10">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Live Alert Preview</div>
                      <div className="text-xs text-slate-400">Just checked &bull; Cached route</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Deal Found
                  </span>
                </div>

                <div className="py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">BLR</div>
                      <div className="text-xs text-slate-500">Bengaluru</div>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <span className="text-[11px] font-medium text-slate-400">1h 15m &bull; Non-stop</span>
                      <div className="w-24 h-[2px] bg-slate-200 dark:bg-slate-700 my-1 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-600"></div>
                      </div>
                      <span className="text-[10px] text-sky-600 font-semibold">IndiGo 6E-214</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">HYD</div>
                      <div className="text-xs text-slate-500">Hyderabad</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Target Rule:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Below ₹4,000</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Current Lowest:</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹2,890</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">(-28%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Travel Date:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">15 Dec 2026</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm text-center shadow-sm">
                    Book on Google Flights &rarr;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              How FareWatch Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
              Set it once and relax. We do the heavy lifting while you get alerted at the right moment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. Select Route & Dates</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose from major Indian airports (BLR, DEL, BOM, HYD, MAA, and more). Monitor a single travel date or a flexible range like 1–15 Dec.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Set Your Price Target</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Define your rule: alert when fares drop below ₹X, or stay within a budget window between ₹X and ₹Y. Optionally toggle non-stop flights only.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Get Alerts & Book</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                FareWatch checks prices every 30 minutes. When a deal appears, you get a clean email with flight details, timings (IST), and a direct booking link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Zero Spam Guarantee</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Intelligent alerts that respect your inbox.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                Other trackers spam your inbox every hour. FareWatch remembers what it sent you: we never alert you for the exact same flight at the same price twice. You only get notified again if the fare drops by 5% or more.
              </p>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Consolidated emails: multiple deals sorted cheapest first</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>One-click pause link directly from your email</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Detailed flight numbers, airlines, duration, and IST timings</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Up to 5 Active Watches</h4>
                  <p className="text-xs text-slate-500">Track multiple upcoming vacations and business trips simultaneously.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Row-Level Security (RLS)</h4>
                  <p className="text-xs text-slate-500">Your saved routes and alerts are private to you and never shared with other users.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Price History Charts</h4>
                  <p className="text-xs text-slate-500">Inspect historical price movements for every watch with interactive graphs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-r from-sky-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to catch your next flight deal?
          </h2>
          <p className="text-sky-100 text-lg max-w-xl mx-auto">
            Join FareWatch today. Set up your first watch in less than 60 seconds.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-sky-700 font-bold text-base shadow-xl hover:bg-sky-50 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
