'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plane,
  Search,
  Mail,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'

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

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent mb-3" />
        <p className="text-sm text-slate-500">Checking admin authorization...</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Admin Access Required
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Your signed-in email is not listed in <code>ADMIN_EMAILS</code>. Only administrators can view application stats and quotas.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs">
              System Admin
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            FareWatch Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-user metrics, SerpApi free budget tracking, and mailer capacity
          </p>
        </div>

        <button
          onClick={handleRunPriceCheck}
          disabled={runningJob}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${runningJob ? 'animate-spin' : ''}`} />
          <span>{runningJob ? 'Running Job...' : 'Trigger Price Check'}</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Users */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Users
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalUsers ?? 0}
            </div>
          </div>
        </div>

        {/* Watches */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Watches
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.activeWatches ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {stats?.totalWatches ?? 0} total
              </span>
            </div>
          </div>
        </div>

        {/* SerpApi Usage */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              SerpApi Searches (Month)
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.apiSearchesMonth ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1.5">/ 250 free quota</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((stats?.apiSearchesMonth || 0) / 250) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Emails Sent Today */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Emails Sent Today
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.emailsSentToday ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1.5">/ 400 daily cap</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((stats?.emailsSentToday || 0) / 400) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Job Execution Result Banner */}
      {jobResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Price Check Run Results</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto">
            {JSON.stringify(jobResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
