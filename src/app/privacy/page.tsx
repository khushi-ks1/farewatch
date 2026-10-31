import Link from 'next/link'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">Last updated: October 2026</p>
          </div>
        </div>

        <section className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            FareWatch collects only the minimum personal information required to deliver our flight alert service:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Your Email Address:</strong> Used for email-link authentication and for sending the flight alerts you set up.</li>
            <li><strong>Flight Watches:</strong> The origin airport, destination airport, travel dates, and price threshold rules you create.</li>
          </ul>
        </section>

        <section className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. How We Use Your Information
          </h2>
          <p>
            Your information is used solely to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Search for flight fares matching your saved routes using our configured flight-search provider.</li>
            <li>Send email alerts when live results match your price rules. Simulated sample fares are never emailed as deals.</li>
            <li>Provide you with historical price charts in your private dashboard.</li>
          </ul>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            We will never sell, rent, or trade your email address or personal data with third-party advertisers.
          </p>
        </section>

        <section className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Data Isolation & Security
          </h2>
          <p>
            Our database utilizes PostgreSQL Row Level Security (RLS). This ensures that each user can only view and manage their own watches. Search results are cached anonymously on the server to reduce third-party API queries.
          </p>
          <p>
            FareWatch uses Supabase to provide authentication and database hosting, a flight-search provider to look up route fares, and an email service to deliver alerts. Route and travel-date details are sent to the flight-search provider to perform each search. Prices may change before you book; always verify the final fare with the booking provider.
          </p>
        </section>

        <section className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Unsubscribing & Deletion
          </h2>
          <p>
            Every alert email contains a direct pause link. You can pause or permanently delete any watch at any time from your dashboard, which immediately ceases price checks and alert emails for that route.
          </p>
        </section>
      </div>
    </div>
  )
}
