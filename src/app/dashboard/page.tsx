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
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

export default function DashboardPage() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const loadWatches = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const res = await fetch('/api/watches')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? 'Please sign in to view your flight watches.'
            : data.error || 'Could not load your flight watches.'
        )
      }
      setWatches(data.watches || [])
      setNow(Date.now())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your flight watches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount; state is set after the request resolves
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
        setMessage({ type: 'error', text: data.error || 'Failed to update watch.' })
      } else {
        setWatches((prev) =>
          prev.map((w) => (w.id === watch.id ? data.watch : w))
        )
        setMessage({
          type: 'success',
          text: watch.is_active ? 'Watch paused.' : 'Watch resumed.',
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error updating watch.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id)
      const res = await fetch(`/api/watches/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete watch.')
      }
      setWatches((prev) => prev.filter((w) => w.id !== id))
      setConfirmDeleteId(null)
      setMessage({ type: 'success', text: 'Watch deleted.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error deleting watch.' })
    } finally {
      setActionLoading(null)
    }
  }

  const activeWatches = watches.filter((w) => w.is_active)

  const formatLastChecked = (isoString?: string | null) => {
    if (!isoString) return 'Not checked yet'
    const diffMs = now - new Date(isoString).getTime()
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
            Your price watches
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeWatches.length} of 5 active watches &bull; fares are checked on a schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadWatches()}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refresh your saved watches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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

      {(message || (loadError && watches.length > 0)) && (
        <div
          role={message?.type === 'error' || loadError ? 'alert' : 'status'}
          className={`mb-6 p-4 rounded-xl border text-sm flex items-center justify-between ${
            message?.type === 'error' || loadError
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
          }`}
        >
          <span>{message?.text || loadError}</span>
          <button
            onClick={() => {
              setMessage(null)
              setLoadError(null)
            }}
            className="text-xs font-bold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading your flight watches...</p>
        </div>
      ) : loadError && watches.length === 0 ? (
        <div className="max-w-xl mx-auto rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-8 text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">We couldn’t load your watches</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
          {loadError.startsWith('Please sign in') ? (
            <Link
              href="/login"
              className="mt-5 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={() => void loadWatches()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}
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
                !watch.current_price_is_mock &&
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
                      {!watch.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Paused
                        </span>
                      ) : watch.current_price_is_mock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          <span>Sample fare</span>
                        </span>
                      ) : (
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
                      <span className="text-xs text-slate-400 font-medium">Lowest recorded</span>
                      <span
                        className={`text-xl font-extrabold ${
                          isDeal
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {watch.current_lowest_price !== null ? formatINR(watch.current_lowest_price) : 'No price yet'}
                      </span>
                    </div>
                    {watch.current_price_is_mock && (
                      <p className="mb-4 text-right text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Simulated sample &bull; not a live fare
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    {confirmDeleteId === watch.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          Delete this watch and its history?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void handleDelete(watch.id)}
                            disabled={actionLoading === watch.id}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === watch.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(watch)}
                        disabled={actionLoading === watch.id}
                        title={watch.is_active ? 'Pause watch' : 'Resume watch'}
                        aria-label={watch.is_active ? 'Pause watch' : 'Resume watch'}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {watch.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(watch.id)}
                        disabled={actionLoading === watch.id}
                        title="Delete watch"
                        aria-label="Delete watch"
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
                    )}
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
