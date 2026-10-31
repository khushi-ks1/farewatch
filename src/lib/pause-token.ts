import { createHmac, timingSafeEqual } from 'crypto'

// Signed tokens for the "Pause this watch" link in alert emails.
// The link works without signing in, so it must prove it came from an email we sent.
// Keyed off CRON_SECRET (server-only) so no extra env var is needed.
function getKey(): string | null {
  const secret = process.env.CRON_SECRET
  return secret ? `farewatch-pause:${secret}` : null
}

export function createPauseToken(watchId: string): string | null {
  const key = getKey()
  if (!key) return null
  return createHmac('sha256', key).update(watchId).digest('base64url')
}

export function isValidPauseToken(watchId: string, token: string | null): boolean {
  const expected = createPauseToken(watchId)
  if (!expected || !token) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}
