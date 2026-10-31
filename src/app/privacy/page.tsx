import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 md:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.04em] text-fg">Privacy policy</h1>
      <p className="mt-1 text-sm text-muted">Last updated October 2026</p>

      <div className="mt-10 space-y-10 border-t border-line pt-10">
        <section className="space-y-3 text-[15px] leading-relaxed text-muted">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Information we collect
          </h2>
          <p>
            FareWatch collects only the minimum personal information required to deliver our flight alert service:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-faint">
            <li><strong className="font-medium text-fg">Your Email Address:</strong> Used for email-link authentication and for sending the flight alerts you set up.</li>
            <li><strong className="font-medium text-fg">Flight Watches:</strong> The origin airport, destination airport, travel dates, and price threshold rules you create.</li>
          </ul>
        </section>

        <section className="space-y-3 text-[15px] leading-relaxed text-muted">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
            How we use your information
          </h2>
          <p>
            Your information is used solely to:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-faint">
            <li>Search for flight fares matching your saved routes using our configured flight-search provider.</li>
            <li>Send email alerts when live results match your price rules. Simulated sample fares are never emailed as deals.</li>
            <li>Provide you with historical price charts in your private dashboard.</li>
          </ul>
          <p className="font-medium text-fg">
            We will never sell, rent, or trade your email address or personal data with third-party advertisers.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-relaxed text-muted">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Data isolation and security
          </h2>
          <p>
            Our database utilizes PostgreSQL Row Level Security (RLS). This ensures that each user can only view and manage their own watches. Search results are cached anonymously on the server to reduce third-party API queries.
          </p>
          <p>
            FareWatch uses Supabase to provide authentication and database hosting, a flight-search provider to look up route fares, and an email service to deliver alerts. Route and travel-date details are sent to the flight-search provider to perform each search. Prices may change before you book; always verify the final fare with the booking provider.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-relaxed text-muted">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Pausing and deleting
          </h2>
          <p>
            Every alert email contains a direct pause link. You can pause or permanently delete any watch at any time from your dashboard, which immediately ceases price checks and alert emails for that route.
          </p>
        </section>
      </div>
    </div>
  )
}
