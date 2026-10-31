'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AirportSelect } from '@/components/AirportSelect'
import { Airport, INDIAN_AIRPORTS } from '@/lib/airports'
import { Plane, ArrowLeft, Calendar, ShieldAlert, CheckCircle2, SlidersHorizontal } from 'lucide-react'

export default function NewWatchPage() {
  const router = useRouter()
  const [origin, setOrigin] = useState<Airport>(INDIAN_AIRPORTS[0]) // BLR default
  const [destination, setDestination] = useState<Airport>(INDIAN_AIRPORTS[3]) // HYD default

  // Date selection
  const [isRange, setIsRange] = useState(false)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30">
            <Plane className="w-6 h-6 -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Flight Watch
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set route & target fare &bull; We will check prices automatically
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Section */}
          <div className="grid sm:grid-cols-2 gap-4">
            <AirportSelect
              label="From (Origin)"
              value={origin.code}
              onChange={setOrigin}
              excludeCode={destination.code}
            />

            <AirportSelect
              label="To (Destination)"
              value={destination.code}
              onChange={setDestination}
              excludeCode={origin.code}
            />
          </div>

          {/* Date Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Travel Date
              </label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setIsRange(false)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    !isRange ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  onClick={() => setIsRange(true)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    isRange ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] text-slate-400 mb-1">
                  {isRange ? 'Earliest Departure' : 'Departure Date'}
                </span>
                <input
                  type="date"
                  required
                  min={tomorrow}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {isRange && (
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1">
                    Latest Departure
                  </span>
                  <input
                    type="date"
                    required
                    min={startDate || tomorrow}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Price Rule Section */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                Price Target Rule
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleType('BELOW')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    ruleType === 'BELOW'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Below ₹X
                </button>
                <button
                  type="button"
                  onClick={() => setRuleType('BETWEEN')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    ruleType === 'BETWEEN'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Between ₹X and ₹Y
                </button>
              </div>
            </div>

            {ruleType === 'BELOW' ? (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Alert me when flight price is below:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="500"
                    required
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="4000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Minimum Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="50"
                      min="500"
                      required
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="3000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Maximum Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="50"
                      min="500"
                      required
                      value={targetPriceUpper}
                      onChange={(e) => setTargetPriceUpper(e.target.value)}
                      placeholder="5500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Non-stop only preference */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nonStopOnly}
                  onChange={(e) => setNonStopOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Non-stop flights only (exclude connecting flights)
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span>Creating & Checking initial fares...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Watch & Start Monitoring</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
