import type React from 'react'
import Link from 'next/link'
import { LogoMark, buttonClass } from '@/components/ui'

// Sample data for the illustrative alert. Not a live fare.
const SAMPLE_PRICES = [5240, 5080, 5390, 4980, 4720, 4860, 4610, 4420, 4560, 4310, 4190, 4080, 3640, 2890]
const SAMPLE_TARGET = 4000

const CHART_W = 560
const CHART_H = 150
const PAD_Y = 14
const MIN_P = 2500
const MAX_P = 5600

const x = (i: number) => (i / (SAMPLE_PRICES.length - 1)) * CHART_W
const y = (p: number) => PAD_Y + (1 - (p - MIN_P) / (MAX_P - MIN_P)) * (CHART_H - PAD_Y * 2)

const linePath = SAMPLE_PRICES.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
const lastX = x(SAMPLE_PRICES.length - 1)
const lastY = y(SAMPLE_PRICES[SAMPLE_PRICES.length - 1])
const targetY = y(SAMPLE_TARGET)

const BENEFITS = [
  {
    title: 'One date or a whole window',
    body: 'Watch a single departure, or let FareWatch scan every day in a window of up to 30 days.',
  },
  {
    title: 'Your price, your rule',
    body: 'Get told when a fare goes under ₹X, or only when it lands between ₹X and ₹Y. Non-stop only if you prefer.',
  },
  {
    title: 'Quiet until it counts',
    body: 'Fares are checked every 30 minutes. You hear about a fare once, and again only if it drops another 5%.',
  },
]

function AlertPreview() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_0_0_var(--line),0_24px_48px_-24px_rgb(0_0_0/0.18)]">
        {/* Message header, styled like the email you receive */}
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark className="h-5 w-5 shrink-0" />
            <span className="text-[13px] font-medium text-fg">FareWatch</span>
            <span className="truncate text-[13px] text-muted">to you</span>
          </div>
          <span className="text-[13px] tabular-nums text-muted">07:30</span>
        </div>

        <div className="px-5 pt-5 pb-4">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
            Bengaluru to Hyderabad is now ₹2,890
          </p>
          <p className="mt-1 text-sm text-muted">
            Your watch for 15 Dec found a fare under your ₹4,000 target.
          </p>

          {/* Price trend with target line */}
          <div className="mt-5">
            <svg
              viewBox={`-8 0 ${CHART_W + 16} ${CHART_H}`}
              className="h-auto w-full overflow-visible"
              role="img"
              aria-label="Sample fare trend over two weeks, falling from ₹5,240 to ₹2,890, below the ₹4,000 target"
            >
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1={0} x2={CHART_W} y1={CHART_H * f} y2={CHART_H * f} className="stroke-line" strokeWidth={1} />
              ))}
              <line
                x1={0}
                x2={CHART_W}
                y1={targetY}
                y2={targetY}
                className="stroke-muted"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <path
                d={linePath}
                pathLength={1}
                fill="none"
                className="fw-draw stroke-accent"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ '--fw-len': 1 } as React.CSSProperties}
              />
              <g className="fw-pop">
                <circle cx={lastX} cy={lastY} r={9} className="fill-accent" fillOpacity={0.15} />
                <circle cx={lastX} cy={lastY} r={4} className="fill-accent" />
              </g>
            </svg>
            <div className="mt-2 flex items-center justify-between gap-4 text-xs text-faint tabular-nums">
              <span>2 Dec</span>
              <span className="flex items-center gap-1.5 text-muted">
                <span className="inline-block w-4 border-t border-dashed border-muted" aria-hidden />
                Target ₹4,000
              </span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Flight row */}
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-6 text-[13px]">
            <div>
              <div className="text-faint">Flight</div>
              <div className="mt-0.5 font-medium text-fg">IndiGo 6E 214</div>
            </div>
            <div>
              <div className="text-faint">Departs</div>
              <div className="mt-0.5 font-medium tabular-nums text-fg">06:10 BLR</div>
            </div>
            <div>
              <div className="text-faint">Stops</div>
              <div className="mt-0.5 font-medium text-fg">Non-stop</div>
            </div>
          </div>
          <span className={buttonClass('secondary', 'sm', 'pointer-events-none self-start sm:self-auto')} aria-hidden>
            View on Google Flights
          </span>
        </div>
      </div>
      <figcaption className="mt-3 text-[13px] text-faint">Example alert with sample data, not a live fare.</figcaption>
    </figure>
  )
}

export default function LandingPage() {
  return (
    <div className="flex-1">
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 md:pt-24 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h1 className="max-w-[12ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-fg sm:text-6xl lg:text-[64px]">
              Know the moment your fare drops.
            </h1>
            <p className="mt-6 max-w-[42ch] text-[17px] leading-relaxed text-muted">
              Pick a route, a date and the price you want to pay. FareWatch checks domestic fares in India through the day
              and emails you when one fits.
            </p>
            <div className="mt-9 flex flex-col items-start gap-3">
              <Link href="/login" className={buttonClass('primary', 'lg')}>
                Create a price alert
              </Link>
              <span className="text-[13px] text-faint">Free. Sign in with your email, no password.</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AlertPreview />
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`py-10 md:py-14 ${i > 0 ? 'border-t border-line md:border-t-0 md:border-l md:pl-8' : ''} ${
                i < BENEFITS.length - 1 ? 'md:pr-8' : ''
              }`}
            >
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">{b.title}</h2>
              <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
