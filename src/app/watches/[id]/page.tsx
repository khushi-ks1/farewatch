'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Watch, PriceSnapshot } from '@/lib/types'
import { formatINR } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import {
  ArrowLeft,
  Plane,
  Sparkles,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Calendar,
  TrendingDown,
} from 'lucide-react'

export default function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [watch, setWatch] = useState<Watch | null>(null)
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const res = await fetch(`/api/watches/${id}`)
      if (res.ok) {
        const data = await res.json()
        setWatch(data.watch)
        setSnapshots(data.snapshots || [])
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount; state is set after the request resolves
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the watch id changes
  }, [id])

  const handleTogglePause = async () => {
    if (!watch) return
    try {
      setActionLoading(true)
      setMessage(null)
      const res = await fetch(`/api/watches/${watch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !watch.is_active }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update watch.')
      }
      setWatch(data.watch)
      setMessage({ type: 'success', text: watch.is_active ? 'Watch paused.' : 'Watch resumed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update watch.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      setMessage(null)
      const res = await fetch(`/api/watches/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete watch.')
      }
      router.push('/dashboard')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete watch.' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
        <p className="text-sm text-slate-500">Loading flight watch details...</p>
      </div>
    )
  }

  if (!watch) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-slate-500 mb-4">Flight watch not found</p>
        <Link href="/dashboard" className="text-sky-600 font-bold underline">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  // Prepare chart data
  const chartData = snapshots.map((s) => {
    const timeLabel = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s.captured_at))

    return {
      time: timeLabel,
      price: Number(s.price),
      airline: s.airline,
      flightNum: s.flight_number,
    }
  })

  const isDeal =
    !watch.current_price_is_mock &&
    watch.current_lowest_price !== null &&
    (watch.rule_type === 'BELOW'
      ? watch.current_lowest_price <= watch.target_price
      : watch.current_lowest_price >= watch.target_price &&
        watch.current_lowest_price <= (watch.target_price_upper || watch.target_price))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 w-full space-y-8">
      {/* Top back & actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            disabled={actionLoading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border ${
              watch.is_active
                ? 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {watch.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{watch.is_active ? 'Pause Watch' : 'Resume Watch'}</span>
          </button>

          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={actionLoading}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
            title="Delete Watch"
            aria-label="Delete watch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border p-4 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
              : 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <div
          role="alertdialog"
          aria-labelledby="delete-watch-title"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"
        >
          <div>
            <h2 id="delete-watch-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Delete this watch?
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Its saved price history will also be removed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={actionLoading}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting…' : 'Delete watch'}
            </button>
          </div>
        </div>
      )}

      {/* Main Watch Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {watch.current_price_is_mock && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-bold">Simulated sample price — not a live fare</p>
            <p className="mt-1 text-xs leading-relaxed">
              This result is for preview only. Simulated fares never trigger email alerts. Configure a live fare provider to monitor bookable prices.
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {!watch.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Paused
                </span>
              ) : watch.current_price_is_mock ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Sample fare
                </span>
              ) : (
                isDeal ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Deal Found
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    Above Target
                  </span>
                )
              )}

              {watch.is_non_stop_only && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600">
                  Non-stop only
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{watch.origin_code}</span>
              <span className="text-slate-400 font-normal">({watch.origin_city})</span>
              <span className="text-slate-300 dark:text-slate-600 text-2xl font-light">&rarr;</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{watch.destination_code}</span>
              <span className="text-slate-400 font-normal">({watch.destination_city})</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {watch.departure_date_start}
                  {watch.departure_date_end ? ` to ${watch.departure_date_end}` : ''}
                </span>
              </span>
              <span>&bull;</span>
              <span>Rule: <strong>{watch.rule_type === 'BELOW' ? `Below ${formatINR(watch.target_price)}` : `${formatINR(watch.target_price)} – ${formatINR(watch.target_price_upper || 0)}`}</strong></span>
            </div>
          </div>

          <div className="text-left md:text-right p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Lowest Recorded Fare</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {watch.current_lowest_price !== null ? formatINR(watch.current_lowest_price) : 'No price yet'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {watch.current_price_is_mock ? 'Simulated sample' : 'Lowest recorded'} &bull; Target: {formatINR(watch.target_price)}
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-sky-600" />
              <span>Price History Trend</span>
            </h3>
            <span className="text-xs text-slate-400">
              Target line: {formatINR(watch.target_price)}
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
              No price history recorded yet. The background scheduler checks every 30 minutes.
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: unknown) => [formatINR(Number(val)), 'Price']}
                  />
                  <ReferenceLine
                    y={Number(watch.target_price)}
                    label={{
                      value: `Target: ${formatINR(watch.target_price)}`,
                      fill: '#ef4444',
                      fontSize: 11,
                      position: 'top',
                    }}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ fill: '#0284c7', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Price Snapshots List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Recorded Flight Snapshots ({snapshots.length})
        </h3>

        {snapshots.length === 0 ? (
          <p className="text-xs text-slate-400">No snapshot records available yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {snapshots.slice().reverse().map((snap) => (
              <div key={snap.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{snap.airline}</span>
                      <span className="text-xs font-normal text-slate-400">({snap.flight_number || 'Direct'})</span>
                      {snap.is_mock && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Simulated &bull; not a live fare
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Flight Date: <strong>{snap.flight_date}</strong> &bull; {snap.stops === 0 ? 'Non-stop' : `${snap.stops} stop`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {formatINR(Number(snap.price))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Captured {new Date(snap.captured_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                    </div>
                  </div>

                  {snap.booking_url && (
                    <a
                      href={snap.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Search fares</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
