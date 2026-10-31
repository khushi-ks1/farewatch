'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { LoadingState, Notice, buttonClass } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalWatches: number
  activeWatches: number
  apiSearchesMonth: number
  emailsSentToday: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [runningJob, setRunningJob] = useState(false)
  const [jobResult, setJobResult] = useState<Record<string, unknown> | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats')
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true)
        return
      }
      const data = await res.json()
      setStats(data.stats)
    } catch {
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount; state is set after the request resolves
    loadStats()
  }, [])

  const handleRunPriceCheck = async () => {
    try {
      setRunningJob(true)
      setJobResult(null)
      const res = await fetch('/api/admin/check-prices', {
        method: 'POST',
      })
      const data = await res.json()
      setJobResult(data)
      await loadStats()
    } catch (err) {
      setJobResult({ error: err instanceof Error ? err.message : 'Execution failed' })
    } finally {
      setRunningJob(false)
    }
  }

  if (loading && !stats) {
    return <LoadingState label="Checking admin access" />
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-[15px] font-semibold text-fg">Admin access required</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Your signed-in email isn’t listed in <code className="font-mono text-[13px] text-fg">ADMIN_EMAILS</code>. Only
          administrators can view usage and quotas.
        </p>
        <Link href="/dashboard" className={buttonClass('secondary', 'md', 'mt-6')}>
          Back to watches
        </Link>
      </div>
    )
  }

  const metrics: { label: string; value: number; limit?: number; limitLabel?: string; secondary?: string }[] = [
    { label: 'Users', value: stats?.totalUsers ?? 0 },
    { label: 'Active watches', value: stats?.activeWatches ?? 0, secondary: `of ${stats?.totalWatches ?? 0} total` },
    { label: 'SerpApi searches this month', value: stats?.apiSearchesMonth ?? 0, limit: 250, limitLabel: 'free quota' },
    { label: 'Emails sent today', value: stats?.emailsSentToday ?? 0, limit: 400, limitLabel: 'daily cap' },
  ]

  const jobFailed = Boolean(jobResult && 'error' in jobResult)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-fg">Admin</h1>
          <p className="mt-1 text-sm text-muted">Usage across all users, search quota and email capacity.</p>
        </div>

        <button onClick={handleRunPriceCheck} disabled={runningJob} className={buttonClass('primary', 'md')}>
          <RefreshCw className={cn('h-3.5 w-3.5', runningJob && 'animate-spin')} />
          {runningJob ? 'Running price check' : 'Run price check now'}
        </button>
      </div>

      <dl className="mt-8 grid overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => {
          const pct = m.limit ? Math.min(100, (m.value / m.limit) * 100) : 0
          return (
            <div
              key={m.label}
              className={cn(
                'px-5 py-5',
                i > 0 && 'border-t border-line sm:border-t-0',
                i % 2 === 1 && 'sm:border-l',
                i >= 2 && 'sm:border-t lg:border-t-0',
                i === 2 && 'lg:border-l'
              )}
            >
              <dt className="text-[13px] text-muted">{m.label}</dt>
              <dd className="mt-1.5">
                <span className="text-[28px] font-semibold tracking-[-0.03em] tabular-nums text-fg">{m.value}</span>
                {m.limit ? (
                  <span className="ml-1.5 text-[13px] tabular-nums text-faint">
                    / {m.limit} {m.limitLabel}
                  </span>
                ) : (
                  m.secondary && <span className="ml-1.5 text-[13px] tabular-nums text-faint">{m.secondary}</span>
                )}
              </dd>
              {m.limit && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-subtle" aria-hidden>
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-500', pct >= 85 ? 'bg-warn' : 'bg-accent')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </dl>

      {jobResult && (
        <section className="mt-8">
          <Notice tone={jobFailed ? 'error' : 'success'}>
            {jobFailed ? 'The price check failed. Details are below.' : 'Price check finished. Results are below.'}
          </Notice>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-fg">
            {JSON.stringify(jobResult, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
