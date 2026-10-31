import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Watch } from '@/lib/types'

/* ---------- Buttons ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,opacity] duration-150 disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-fg text-bg hover:opacity-85',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-subtle',
  ghost: 'text-muted hover:text-fg hover:bg-subtle',
  danger: 'bg-bad text-white hover:opacity-90 dark:text-bg',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

export const iconButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-50'

/* ---------- Form fields ---------- */

export const labelClass = 'block text-[13px] font-medium text-fg mb-1.5'
export const hintClass = 'text-[13px] text-muted'
export const inputClass =
  'w-full h-10 rounded-md border border-line-strong bg-surface px-3 text-sm text-fg placeholder:text-faint transition-colors hover:border-faint focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent-soft'

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-subtle p-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-7 rounded-[5px] px-3 text-[13px] font-medium transition-colors',
              active ? 'bg-surface text-fg shadow-[0_0_0_1px_var(--line-strong)]' : 'text-muted hover:text-fg'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Status ---------- */

export type WatchStatus = 'deal' | 'above' | 'paused' | 'sample' | 'pending'

export function isWatchDeal(watch: Watch) {
  return (
    !watch.current_price_is_mock &&
    watch.current_lowest_price !== null &&
    (watch.rule_type === 'BELOW'
      ? watch.current_lowest_price <= watch.target_price
      : watch.current_lowest_price >= watch.target_price &&
        watch.current_lowest_price <= (watch.target_price_upper || watch.target_price))
  )
}

export function getWatchStatus(watch: Watch): WatchStatus {
  if (!watch.is_active) return 'paused'
  if (watch.current_price_is_mock) return 'sample'
  if (watch.current_lowest_price === null) return 'pending'
  return isWatchDeal(watch) ? 'deal' : 'above'
}

const pillStyles: Record<WatchStatus, { label: string; className: string; dot: string }> = {
  deal: { label: 'On target', className: 'bg-good-soft text-good', dot: 'bg-good' },
  above: { label: 'Above target', className: 'bg-subtle text-muted', dot: 'bg-faint' },
  paused: { label: 'Paused', className: 'bg-subtle text-faint', dot: 'bg-faint/60' },
  sample: { label: 'Sample fare', className: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  pending: { label: 'Waiting for first check', className: 'bg-accent-soft text-accent', dot: 'bg-accent' },
}

export function StatusPill({ status, className }: { status: WatchStatus; className?: string }) {
  const s = pillStyles[status]
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        s.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}

/* ---------- Feedback ---------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-line-strong border-t-fg',
        className
      )}
    />
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function Notice({
  tone,
  children,
  onDismiss,
  className,
}: {
  tone: 'success' | 'error' | 'info' | 'warning'
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}) {
  const tones = {
    success: 'border-good/25 bg-good-soft text-fg',
    error: 'border-bad/25 bg-bad-soft text-fg',
    info: 'border-line bg-surface text-fg',
    warning: 'border-warn/25 bg-warn-soft text-fg',
  }
  const dots = { success: 'bg-good', error: 'bg-bad', info: 'bg-accent', warning: 'bg-warn' }
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', tones[tone], className)}
    >
      <span className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', dots[tone])} aria-hidden />
      <div className="flex-1 leading-relaxed">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="-mr-1 rounded p-0.5 text-muted hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* ---------- Brand ---------- */

/** A fare line dipping under a dashed target: the product in one glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('h-6 w-6', className)}>
      <rect width="24" height="24" rx="6" className="fill-fg" />
      <path d="M5 14.5h14" className="stroke-bg" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="1.6 1.6" />
      <path
        d="M5 9l3.5 2 3-3.5 3.5 8.5L19 12"
        className="stroke-bg"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="16" r="1.9" className="fill-accent" />
    </svg>
  )
}
