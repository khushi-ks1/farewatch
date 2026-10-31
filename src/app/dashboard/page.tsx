'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Watch } from '@/lib/types'
import { formatINR } from '@/lib/utils'
import {
  Plane,
  Plus,
  Play,
  Pause,
  Trash2,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

export default function DashboardPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [checkingPrices, setCheckingPrices] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadWatches = async () => {
    try {
      const res = await fetch('/api/watches')
      if (res.ok) {
        const data = await res.json()
        setWatches(data.watches || [])
      }
    } catch (err) {
      console.error('Failed to load watches', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWatches()
  }, [])

  const handleToggleActive = async (watch: Watch) => {
    try {
      setActionLoading(watch.id)
      const res = await fetch(`/api/watches/${watch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !watch.is_active }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to update watch')
      } else {
        setWatches((prev) =>
          prev.map((w) => (w.id === watch.id ? data.watch : w))
        )
      }
    } catch {
      alert('Error updating watch')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watch? Price history will also be removed.')) return

    try {
      setActionLoading(id)
      const res = await fetch(`/api/watches/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWatches((prev) => prev.filter((w) => w.id !== id))
      } else {
        alert('Failed to delete watch')
      }
    } catch {
      alert('Error deleting watch')
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualCheckPrices = async () => {
    try {
      setCheckingPrices(true)
      setMessage(null)
      const res = await fetch('/api/cron/check-prices', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Price check complete! Scanned ${data.summary?.watchesChecked ?? 0} active watches.`)
        await loadWatches()
      } else {
        setMessage(`Price check failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      setMessage(`Price check error: ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setCheckingPrices(false)
    }
  }

  const activeWatches = watches.filter((w) => w.is_active)
  const pausedWatches = watches.filter((w) => !w.is_active)

  const formatLastChecked = (isoString?: string | null) => {
    if (!isoString) return 'Not checked yet'
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Your Flight Watches
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking {activeWatches.length} of 5 active watches allowed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualCheckPrices}
            disabled={checkingPrices || activeWatches.length === 0}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Scan prices now"
          >
            <RefreshCw className={`w-4 h-4 ${checkingPrices ? 'animate-spin' : ''}`} />
            <span>{checkingPrices ? 'Scanning...' : 'Check Prices Now'}</span>
          </button>

          <Link
            href="/watches/new"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Watch</span>
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading your flight watches...</p>
        </div>
      ) : watches.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-16 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mx-auto mb-5">
            <Plane className="w-8 h-8 -rotate-45" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No flight watches yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Create your first watch for any Indian route (e.g. BLR → HYD, DEL → BOM). We will monitor fares automatically and notify you of drops.
          </p>
          <Link
            href="/watches/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Watch</span>
          </Link>
        </div>
      ) : (
        /* Watches List */
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {watches.map((watch) => {
              const isDeal =
                watch.current_lowest_price !== null &&
                (watch.rule_type === 'BELOW'
                  ? watch.current_lowest_price <= watch.target_price
                  : watch.current_lowest_price >= watch.target_price &&
                    watch.current_lowest_price <= (watch.target_price_upper || watch.target_price))

              return (
                <div
                  key={watch.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    watch.is_active
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800 opacity-65'
                  }`}
                >
                  <div>
                    {/* Top row: Status & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      {watch.is_active ? (
                        isDeal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            <Sparkles className="w-3 h-3" />
                            <span>Deal found!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            <span>Above target</span>
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Paused
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatLastChecked(watch.last_checked_at)}</span>
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {watch.origin_code}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[100px]">
                          {watch.origin_city}
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] text-slate-400">
                          {watch.is_non_stop_only ? 'Non-stop' : 'Direct/1-stop'}
                        </span>
                        <div className="w-16 h-[2px] bg-slate-200 dark:bg-slate-700 my-1 relative">
                          <Plane className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-600" />
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {watch.destination_code}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[100px]">
                          {watch.destination_city}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span className="font-semibold">
                          {watch.departure_date_start}
                          {watch.departure_date_end ? ` → ${watch.departure_date_end}` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target:</span>
                        <span className="font-semibold">
                          {watch.rule_type === 'BELOW'
                            ? `Below ${formatINR(watch.target_price)}`
                            : `${formatINR(watch.target_price)} – ${formatINR(watch.target_price_upper || 0)}`}
                        </span>
                      </div>
                    </div>

                    {/* Price Status */}
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-xs text-slate-400 font-medium">Current Lowest</span>
                      <span
                        className={`text-xl font-extrabold ${
                          isDeal
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {watch.current_lowest_price ? formatINR(watch.current_lowest_price) : 'Checking...'}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(watch)}
                        disabled={actionLoading === watch.id}
                        title={watch.is_active ? 'Pause watch' : 'Resume watch'}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {watch.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => handleDelete(watch.id)}
                        disabled={actionLoading === watch.id}
                        title="Delete watch"
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      href={`/watches/${watch.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      <span>Price History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
