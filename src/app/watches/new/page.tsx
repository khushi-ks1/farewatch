'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AirportSelect } from '@/components/AirportSelect'
import { maxRangeEnd } from '@/lib/watch-validation'
import { Airport, INDIAN_AIRPORTS } from '@/lib/airports'
import { ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { Notice, Segmented, Spinner, buttonClass, hintClass, inputClass, labelClass } from '@/components/ui'

export default function NewWatchPage() {
  const router = useRouter()
  const [origin, setOrigin] = useState<Airport>(INDIAN_AIRPORTS[0]) // BLR default
  const [destination, setDestination] = useState<Airport>(INDIAN_AIRPORTS[3]) // HYD default

  // Date selection
  const [isRange, setIsRange] = useState(false)
  const [tomorrow] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [nextWeek] = useState(() => new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(tomorrow)
  const [endDate, setEndDate] = useState(nextWeek)

  // Price Rule
  const [ruleType, setRuleType] = useState<'BELOW' | 'BETWEEN'>('BELOW')
  const [targetPrice, setTargetPrice] = useState('4000')
  const [targetPriceUpper, setTargetPriceUpper] = useState('6000')
  const [nonStopOnly, setNonStopOnly] = useState(false)

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (origin.code === destination.code) {
      setError('Origin and destination airport cannot be the same.')
      return
    }

    if (!startDate) {
      setError('Please select a travel departure date.')
      return
    }

    if (isRange && (!endDate || endDate < startDate)) {
      setError('End date must be on or after the start date.')
      return
    }

    const priceNum = Number(targetPrice)
    if (isNaN(priceNum) || priceNum <= 500) {
      setError('Please enter a realistic target price in INR (at least ₹500).')
      return
    }

    let upperNum: number | null = null
    if (ruleType === 'BETWEEN') {
      upperNum = Number(targetPriceUpper)
      if (isNaN(upperNum) || upperNum <= priceNum) {
        setError('Upper price bound must be higher than lower target price.')
        return
      }
    }

    try {
      setLoading(true)
      const res = await fetch('/api/watches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_code: origin.code,
          destination_code: destination.code,
          departure_date_start: startDate,
          departure_date_end: isRange ? endDate : null,
          rule_type: ruleType,
          target_price: priceNum,
          target_price_upper: upperNum,
          is_non_stop_only: nonStopOnly,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create watch')
      }

      router.push(`/watches/${data.watch.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const swapRoute = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const priceInput = (id: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">₹</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        step="50"
        min="500"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-7 tabular-nums`}
      />
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 md:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Watches
      </Link>

      <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.035em] text-fg">New watch</h1>
      <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-muted">
        Tell us where you’re going and what you want to pay. We check fares every 30 minutes and email you when one fits.
      </p>

      {error && (
        <Notice tone="error" className="mt-6">
          {error}
        </Notice>
      )}

      <form onSubmit={handleSubmit} className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
        {/* Route */}
        <fieldset className="min-w-0 p-5 sm:p-6">
          <legend className="sr-only">Route</legend>
          <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <AirportSelect label="From" value={origin.code} onChange={setOrigin} excludeCode={destination.code} />
            <button
              type="button"
              onClick={swapRoute}
              aria-label="Swap origin and destination"
              title="Swap"
              className="hidden h-12 w-9 items-center justify-center rounded-md text-faint transition-colors hover:bg-subtle hover:text-fg sm:inline-flex"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <AirportSelect label="To" value={destination.code} onChange={setDestination} excludeCode={origin.code} />
          </div>
        </fieldset>

        {/* Dates */}
        <fieldset aria-labelledby="when-heading" className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="when-heading" className="text-[15px] font-semibold text-fg">When</h2>
            <Segmented
              label="Date mode"
              value={isRange ? 'range' : 'single'}
              onChange={(v) => setIsRange(v === 'range')}
              options={[
                { value: 'single', label: 'One date' },
                { value: 'range', label: 'Date range' },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-date" className={labelClass}>
                {isRange ? 'Earliest departure' : 'Departure'}
              </label>
              <input
                id="start-date"
                type="date"
                required
                min={tomorrow}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            {isRange && (
              <div>
                <label htmlFor="end-date" className={labelClass}>
                  Latest departure
                </label>
                <input
                  id="end-date"
                  type="date"
                  required
                  min={startDate || tomorrow}
                  max={maxRangeEnd(startDate || tomorrow)}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            )}
          </div>
          {isRange && <p className={`${hintClass} mt-3`}>We check every day in the range, up to 30 days.</p>}
        </fieldset>

        {/* Price rule */}
        <fieldset aria-labelledby="price-heading" className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="price-heading" className="text-[15px] font-semibold text-fg">Alert me when the fare is</h2>
            <Segmented
              label="Price rule"
              value={ruleType}
              onChange={setRuleType}
              options={[
                { value: 'BELOW', label: 'Under a price' },
                { value: 'BETWEEN', label: 'In a range' },
              ]}
            />
          </div>

          {ruleType === 'BELOW' ? (
            <div className="mt-4 sm:max-w-[calc(50%-0.5rem)]">
              <label htmlFor="target-price" className={labelClass}>
                Under
              </label>
              {priceInput('target-price', targetPrice, setTargetPrice, '4000')}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="target-price" className={labelClass}>
                  From
                </label>
                {priceInput('target-price', targetPrice, setTargetPrice, '3000')}
              </div>
              <div>
                <label htmlFor="target-price-upper" className={labelClass}>
                  To
                </label>
                {priceInput('target-price-upper', targetPriceUpper, setTargetPriceUpper, '5500')}
              </div>
            </div>
          )}

          <label className="mt-5 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={nonStopOnly}
              onChange={(e) => setNonStopOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
            />
            <span className="text-sm text-fg">Non-stop flights only</span>
          </label>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className={hintClass}>Sample fares are labelled and never sent as alerts.</p>
          <button type="submit" disabled={loading} className={buttonClass('primary', 'md', 'h-10 px-5')}>
            {loading && <Spinner className="border-bg/30 border-t-bg" />}
            {loading ? 'Saving and checking fares' : 'Save watch'}
          </button>
        </div>
      </form>
    </div>
  )
}
