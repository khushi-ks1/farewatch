'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Watch, PriceSnapshot } from '@/lib/types'
import { cn, formatINR, formatTravelDates } from '@/lib/utils'
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
import { ArrowLeft, ExternalLink, Pause, Play, Trash2 } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { LoadingState, Notice, StatusPill, buttonClass, getWatchStatus } from '@/components/ui'

// Recharts writes colours as SVG attributes, so it gets hex values rather than CSS variables.
const CHART_COLORS = {
  light: { line: '#4338ca', grid: '#e6e5e2', axis: '#9a9aa0', target: '#66666c', tipBg: '#ffffff', tipBorder: '#d4d3cf', tipText: '#111112' },
  dark: { line: '#8b8dff', grid: '#222225', axis: '#66666d', target: '#9c9ca3', tipBg: '#18181b', tipBorder: '#2f2f33', tipText: '#ededee' },
}


export default function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { theme } = useTheme()
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
    return <LoadingState label="Loading watch" />
  }

  if (!watch) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-[15px] font-semibold text-fg">This watch doesn’t exist</h1>
        <p className="mt-1.5 text-sm text-muted">It may have been deleted.</p>
        <Link href="/dashboard" className={buttonClass('secondary', 'md', 'mt-6')}>
          Back to watches
        </Link>
      </div>
    )
  }

  const colors = CHART_COLORS[theme]

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

  const status = getWatchStatus(watch)
  const ruleText =
    watch.rule_type === 'BELOW'
      ? `Under ${formatINR(watch.target_price)}`
      : `${formatINR(watch.target_price)} – ${formatINR(watch.target_price_upper || 0)}`

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Watches
      </Link>

      {/* Header */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            {watch.is_non_stop_only && (
              <span className="inline-flex h-6 items-center rounded-full border border-line px-2.5 text-xs text-muted">
                Non-stop only
              </span>
            )}
          </div>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.04em] text-fg tabular-nums">
            {watch.origin_code} – {watch.destination_code}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {watch.origin_city} to {watch.destination_city}, {formatTravelDates(watch.departure_date_start, watch.departure_date_end)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleTogglePause} disabled={actionLoading} className={buttonClass('secondary', 'md')}>
            {watch.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {watch.is_active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={actionLoading}
            className={buttonClass('secondary', 'md', 'w-9 px-0 text-muted hover:text-bad')}
            title="Delete watch"
            aria-label="Delete watch"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {message && (
        <Notice tone={message.type} onDismiss={() => setMessage(null)} className="mt-6">
          {message.text}
        </Notice>
      )}

      {confirmingDelete && (
        <div
          role="alertdialog"
          aria-labelledby="delete-watch-title"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-bad/25 bg-bad-soft px-4 py-3"
        >
          <div>
            <h2 id="delete-watch-title" className="text-sm font-medium text-fg">
              Delete this watch?
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">Its saved price history will also be removed.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmingDelete(false)} className={buttonClass('ghost', 'sm')}>
              Cancel
            </button>
            <button onClick={() => void handleDelete()} disabled={actionLoading} className={buttonClass('danger', 'sm')}>
              {actionLoading ? 'Deleting' : 'Delete watch'}
            </button>
          </div>
        </div>
      )}

      {watch.current_price_is_mock && (
        <Notice tone="warning" className="mt-6">
          <span className="font-medium">This is a simulated sample price, not a live fare.</span> Simulated fares are for
          preview only and never trigger email alerts. Configure a live fare provider to monitor bookable prices.
        </Notice>
      )}

      {/* Key figures */}
      <dl className="mt-8 grid grid-cols-2 divide-line overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-3 sm:divide-x">
        <div className="col-span-2 border-b border-line px-5 py-4 sm:col-span-1 sm:border-b-0">
          <dt className="text-[13px] text-muted">{watch.current_price_is_mock ? 'Lowest sample fare' : 'Lowest recorded fare'}</dt>
          <dd
            className={cn(
              'mt-1 text-[28px] font-semibold tracking-[-0.03em] tabular-nums',
              status === 'deal' ? 'text-good' : 'text-fg'
            )}
          >
            {watch.current_lowest_price !== null ? formatINR(watch.current_lowest_price) : '—'}
          </dd>
        </div>
        <div className="border-r border-line px-5 py-4 sm:border-r-0">
          <dt className="text-[13px] text-muted">Your target</dt>
          <dd className="mt-1 text-[17px] font-medium tabular-nums text-fg">{ruleText}</dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[13px] text-muted">Checks recorded</dt>
          <dd className="mt-1 text-[17px] font-medium tabular-nums text-fg">{snapshots.length}</dd>
        </div>
      </dl>

      {/* Price history chart */}
      <section className="mt-8 rounded-lg border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-fg">Price history</h2>
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: colors.target }} aria-hidden />
            Target
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-muted">
            No prices yet. The first check runs within 30 minutes.
          </div>
        ) : (
          <div className="h-72 w-full px-2 pt-5 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis
                  dataKey="time"
                  stroke={colors.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={32}
                  dy={6}
                />
                <YAxis
                  stroke={colors.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => formatINR(Number(val))}
                />
                <Tooltip
                  cursor={{ stroke: colors.grid }}
                  contentStyle={{
                    backgroundColor: colors.tipBg,
                    borderRadius: '8px',
                    border: `1px solid ${colors.tipBorder}`,
                    color: colors.tipText,
                    fontSize: '12px',
                    boxShadow: 'none',
                  }}
                  labelStyle={{ color: colors.axis, marginBottom: 2 }}
                  itemStyle={{ color: colors.tipText }}
                  formatter={(val: unknown) => [formatINR(Number(val)), 'Fare']}
                />
                <ReferenceLine y={Number(watch.target_price)} stroke={colors.target} strokeDasharray="4 4" />
                {watch.rule_type === 'BETWEEN' && watch.target_price_upper && (
                  <ReferenceLine y={Number(watch.target_price_upper)} stroke={colors.target} strokeDasharray="4 4" />
                )}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={colors.line}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: colors.line }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Snapshots */}
      <section className="mt-8 rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-fg">Fares found</h2>
        </div>

        {snapshots.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">Fares will appear here after the first check.</p>
        ) : (
          <ul className="divide-y divide-line">
            {snapshots.slice().reverse().map((snap) => (
              <li key={snap.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium text-fg">{snap.airline}</span>
                    <span className="text-muted">{snap.flight_number || 'Direct'}</span>
                    {snap.is_mock && (
                      <span className="inline-flex h-5 items-center rounded-full bg-warn-soft px-2 text-[11px] font-medium text-warn">
                        Simulated, not a live fare
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted tabular-nums">
                    {formatTravelDates(snap.flight_date)}, {snap.stops === 0 ? 'non-stop' : `${snap.stops} stop`}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-right">
                    <div className="text-[15px] font-medium tabular-nums text-fg">{formatINR(Number(snap.price))}</div>
                    <div className="text-xs text-faint tabular-nums">
                      {new Date(snap.captured_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                    </div>
                  </div>

                  {snap.booking_url && (
                    <a
                      href={snap.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass('secondary', 'sm')}
                    >
                      Search fares
                      <ExternalLink className="h-3.5 w-3.5 text-muted" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
