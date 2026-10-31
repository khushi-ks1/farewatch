import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateDateRange, validateWatchPatch, maxRangeEnd, countDaysInRange } from '../watch-validation'
import { getDatesInRange } from '../cron/price-checker'

const belowRule = { is_active: true, rule_type: 'BELOW', target_price: 4000, target_price_upper: null }
const betweenRule = { is_active: true, rule_type: 'BETWEEN', target_price: 3000, target_price_upper: 5000 }

test('date range: single date and up to 30 days are allowed', () => {
  assert.equal(validateDateRange('2026-12-01'), null)
  assert.equal(validateDateRange('2026-12-01', '2026-12-30'), null)
  assert.equal(countDaysInRange('2026-12-01', '2026-12-30'), 30)
})

test('date range: 31 days or a reversed range is rejected', () => {
  assert.match(validateDateRange('2026-12-01', '2026-12-31') ?? '', /at most 30 days/)
  assert.match(validateDateRange('2026-12-10', '2026-12-01') ?? '', /after start date/)
})

test('maxRangeEnd matches what the price checker actually searches', () => {
  const end = maxRangeEnd('2026-12-01')
  assert.equal(end, '2026-12-30')
  assert.equal(validateDateRange('2026-12-01', end), null)
  assert.equal(getDatesInRange('2026-12-01', end).length, 30)
})

test('patch: toggling is_active is accepted, wrong types are rejected', () => {
  assert.deepEqual(validateWatchPatch({ is_active: false }, belowRule), { ok: true, updates: { is_active: false } })
  assert.equal(validateWatchPatch({ is_active: 'no' }, belowRule).ok, false)
  assert.equal(validateWatchPatch({ target_price: '4000' }, belowRule).ok, false)
  assert.equal(validateWatchPatch({ target_price: -5 }, belowRule).ok, false)
  assert.equal(validateWatchPatch({ rule_type: 'ABOVE' }, belowRule).ok, false)
  assert.equal(validateWatchPatch([], belowRule).ok, false)
})

test('patch: unknown fields are ignored and an empty update is rejected', () => {
  assert.equal(validateWatchPatch({ user_id: 'someone-else' }, belowRule).ok, false)
  const r = validateWatchPatch({ is_active: true, user_id: 'x' }, belowRule)
  assert.deepEqual(r, { ok: true, updates: { is_active: true } })
})

test('patch: BETWEEN rule must keep upper above lower, using current values', () => {
  assert.equal(validateWatchPatch({ target_price: 6000 }, betweenRule).ok, false)
  assert.equal(validateWatchPatch({ target_price: 4000 }, betweenRule).ok, true)
  assert.equal(validateWatchPatch({ rule_type: 'BETWEEN' }, belowRule).ok, false)
  assert.equal(validateWatchPatch({ rule_type: 'BETWEEN', target_price_upper: 5000 }, belowRule).ok, true)
})

test('patch: switching to BELOW clears the upper price', () => {
  assert.deepEqual(validateWatchPatch({ rule_type: 'BELOW' }, betweenRule), {
    ok: true,
    updates: { rule_type: 'BELOW', target_price_upper: null },
  })
})
