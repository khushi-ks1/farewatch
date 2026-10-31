import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDateYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Formats a YYYY-MM-DD travel date (or range) for display, e.g. "15 Dec 2026" or "1 Dec – 15 Dec 2026". */
export function formatTravelDates(start: string, end?: string | null): string {
  const s = new Date(`${start}T00:00:00Z`)
  if (Number.isNaN(s.getTime())) return end ? `${start} – ${end}` : start
  if (!end) return shortDateYear.format(s)
  const e = new Date(`${end}T00:00:00Z`)
  if (Number.isNaN(e.getTime())) return `${start} – ${end}`
  const startLabel = s.getUTCFullYear() === e.getUTCFullYear() ? shortDate.format(s) : shortDateYear.format(s)
  return `${startLabel} – ${shortDateYear.format(e)}`
}
