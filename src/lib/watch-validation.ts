// Shared validation for creating and editing watches.

/** The price checker searches at most this many departure dates per watch. */
export const MAX_RANGE_DAYS = 30

const DAY_MS = 86_400_000

/** Number of departure dates in an inclusive YYYY-MM-DD range. */
export function countDaysInRange(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1
}

/** Returns an error message, or null if the range is valid. */
export function validateDateRange(start: string, end?: string | null): string | null {
  if (!end) return null
  if (end < start) return 'End date must be after start date'
  if (countDaysInRange(start, end) > MAX_RANGE_DAYS) {
    return `Date range can be at most ${MAX_RANGE_DAYS} days`
  }
  return null
}

/** Latest allowed end date (YYYY-MM-DD) for a range starting on `start`. */
export function maxRangeEnd(start: string): string {
  return new Date(Date.parse(start) + (MAX_RANGE_DAYS - 1) * DAY_MS).toISOString().split('T')[0]
}

const isPositivePrice = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 10_000_000

export interface CurrentWatchRule {
  is_active: boolean
  rule_type: string
  target_price: number | string
  target_price_upper: number | string | null
}

export type WatchPatchResult =
  | { ok: true; updates: Record<string, unknown> }
  | { ok: false; error: string }

/** Validates a PATCH body against the watch's current rule. Only known fields are accepted. */
export function validateWatchPatch(body: unknown, current: CurrentWatchRule): WatchPatchResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid payload' }
  }
  const b = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if ('is_active' in b) {
    if (typeof b.is_active !== 'boolean') return { ok: false, error: 'is_active must be true or false' }
    updates.is_active = b.is_active
  }

  if ('rule_type' in b) {
    if (b.rule_type !== 'BELOW' && b.rule_type !== 'BETWEEN') {
      return { ok: false, error: 'rule_type must be BELOW or BETWEEN' }
    }
    updates.rule_type = b.rule_type
  }

  if ('target_price' in b) {
    if (!isPositivePrice(b.target_price)) return { ok: false, error: 'target_price must be a positive number' }
    updates.target_price = b.target_price
  }

  if ('target_price_upper' in b) {
    if (b.target_price_upper !== null && !isPositivePrice(b.target_price_upper)) {
      return { ok: false, error: 'target_price_upper must be a positive number or null' }
    }
    updates.target_price_upper = b.target_price_upper
  }

  if (Object.keys(updates).length === 0) return { ok: false, error: 'No valid fields to update' }

  // Check the price rule as it will be after this update
  const ruleType = updates.rule_type ?? current.rule_type
  if (ruleType === 'BETWEEN') {
    const lower = Number(updates.target_price ?? current.target_price)
    const upperRaw = 'target_price_upper' in updates ? updates.target_price_upper : current.target_price_upper
    const upper = upperRaw === null || upperRaw === undefined ? NaN : Number(upperRaw)
    if (!(upper > lower)) {
      return { ok: false, error: 'Upper target price must be higher than lower target price' }
    }
  } else if ('rule_type' in updates) {
    updates.target_price_upper = null
  }

  return { ok: true, updates }
}
