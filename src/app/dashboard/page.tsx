'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Watch } from '@/lib/types'
import { cn, formatINR, formatTravelDates } from '@/lib/utils'
import {
  LoadingState,
  Notice,
  StatusPill,
  buttonClass,
  getWatchStatus,
  iconButtonClass,
} from '@/components/ui'
import { Plus, Play, Pause, Trash2, RefreshCw, ChevronRight } from 'lucide-react'

const ruleLabel = (watch: Watch) =>
  watch.rule_type === 'BELOW'
    ? `Under ${formatINR(watch.target_price)}`
    : `${formatINR(watch.target_price)} – ${formatINR(watch.target_price_upper || 0)}`

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
    if (!isoString) return 'Not yet'
    const diffMs = now - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 48) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const renderActions = (watch: Watch) =>
    confirmDeleteId === watch.id ? (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="mr-1 text-[13px] text-muted">Delete with its history?</span>
        <button onClick={() => setConfirmDeleteId(null)} className={buttonClass('ghost', 'sm')}>
          Cancel
        </button>
        <button
          onClick={() => void handleDelete(watch.id)}
          disabled={actionLoading === watch.id}
          className={buttonClass('danger', 'sm')}
        >
          {actionLoading === watch.id ? 'Deleting' : 'Delete'}
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-end gap-0.5">
        <button
          onClick={() => handleToggleActive(watch)}
          disabled={actionLoading === watch.id}
          title={watch.is_active ? 'Pause watch' : 'Resume watch'}
          aria-label={watch.is_active ? 'Pause watch' : 'Resume watch'}
          className={iconButtonClass}
        >
          {watch.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setConfirmDeleteId(watch.id)}
          disabled={actionLoading === watch.id}
          title="Delete watch"
          aria-label="Delete watch"
          className={cn(iconButtonClass, 'hover:text-bad')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <Link
          href={`/watches/${watch.id}`}
          title="Open price history"
          aria-label={`Open price history for ${watch.origin_code} to ${watch.destination_code}`}
          className={iconButtonClass}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-fg">Watches</h1>
          <p className="mt-1 text-sm text-muted">
            {activeWatches.length} of 5 active. Fares are checked every 30 minutes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadWatches()}
            disabled={loading}
            className={buttonClass('secondary', 'md')}
            title="Refresh your saved watches"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <Link href="/watches/new" className={buttonClass('primary', 'md')}>
            <Plus className="h-4 w-4" />
            New watch
          </Link>
        </div>
      </div>

      {(message || (loadError && watches.length > 0)) && (
        <Notice
          tone={message?.type === 'error' || loadError ? 'error' : 'success'}
          onDismiss={() => {
            setMessage(null)
            setLoadError(null)
          }}
          className="mt-6"
        >
          {message?.text || loadError}
        </Notice>
      )}

      <div className="mt-8">
        {loading && watches.length === 0 ? (
          <LoadingState label="Loading your watches" />
        ) : loadError && watches.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-6 py-14 text-center">
            <h2 className="text-[15px] font-semibold text-fg">We couldn’t load your watches</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{loadError}</p>
            {loadError.startsWith('Please sign in') ? (
              <Link href="/login" className={buttonClass('primary', 'md', 'mt-6')}>
                Sign in
              </Link>
            ) : (
              <button onClick={() => void loadWatches()} className={buttonClass('secondary', 'md', 'mt-6')}>
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            )}
          </div>
        ) : watches.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Table on larger screens */}
            <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[13px] text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium">Route</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Travel dates</th>
                    <th scope="col" className="px-4 py-2.5 font-medium text-right">Target</th>
                    <th scope="col" className="px-4 py-2.5 font-medium text-right">Lowest fare</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Checked</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {watches.map((watch) => {
                    const status = getWatchStatus(watch)
                    return (
                      <tr
                        key={watch.id}
                        className={cn('transition-colors hover:bg-subtle/60', !watch.is_active && 'text-muted')}
                      >
                        <td className="px-4 py-3.5">
                          <Link href={`/watches/${watch.id}`} className="group block">
                            <span className="font-medium tabular-nums text-fg group-hover:text-accent">
                              {watch.origin_code} – {watch.destination_code}
                            </span>
                            <span className="mt-0.5 block text-[13px] text-muted">
                              {watch.origin_city} to {watch.destination_city}
                              {watch.is_non_stop_only && ', non-stop'}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {formatTravelDates(watch.departure_date_start, watch.departure_date_end)}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-muted">{ruleLabel(watch)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span className={cn('font-medium', status === 'deal' ? 'text-good' : 'text-fg', !watch.is_active && 'text-muted')}>
                            {watch.current_lowest_price !== null ? formatINR(watch.current_lowest_price) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={status} />
                        </td>
                        <td className="px-4 py-3.5 text-[13px] tabular-nums text-muted whitespace-nowrap">
                          {formatLastChecked(watch.last_checked_at)}
                        </td>
                        <td className="px-3 py-3.5">{renderActions(watch)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Stacked list on phones */}
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface md:hidden">
              {watches.map((watch) => {
                const status = getWatchStatus(watch)
                return (
                  <li key={watch.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/watches/${watch.id}`} className="min-w-0">
                        <span className="block font-medium tabular-nums text-fg">
                          {watch.origin_code} – {watch.destination_code}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">
                          {formatTravelDates(watch.departure_date_start, watch.departure_date_end)}
                        </span>
                      </Link>
                      <StatusPill status={status} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="text-[13px] text-muted tabular-nums">
                        <span className={cn('block text-[15px] font-medium', status === 'deal' ? 'text-good' : 'text-fg')}>
                          {watch.current_lowest_price !== null ? formatINR(watch.current_lowest_price) : 'No fare yet'}
                        </span>
                        {ruleLabel(watch)}, checked {formatLastChecked(watch.last_checked_at).toLowerCase()}
                      </div>
                    </div>
                    <div className="mt-2 -mr-2">{renderActions(watch)}</div>
                  </li>
                )
              })}
            </ul>

            {watches.some((w) => w.current_price_is_mock) && (
              <p className="mt-3 text-[13px] text-faint">
                Sample fares are simulated for preview and never trigger an alert.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
      <h2 className="text-[15px] font-semibold text-fg">No watches yet</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        Add a route like Bengaluru to Hyderabad, choose your dates and the most you want to pay. We’ll email you when a
        fare fits.
      </p>
      <Link href="/watches/new" className={buttonClass('primary', 'md', 'mt-6')}>
        <Plus className="h-4 w-4" />
        Create your first watch
      </Link>
    </div>
  )
}
