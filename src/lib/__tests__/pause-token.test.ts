import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPauseToken, isValidPauseToken } from '../pause-token'

test('pause token only works for the watch it was made for', () => {
  process.env.CRON_SECRET = 'test-secret'
  const token = createPauseToken('watch-1')
  assert.ok(token)
  assert.equal(isValidPauseToken('watch-1', token), true)
  assert.equal(isValidPauseToken('watch-2', token), false)
  assert.equal(isValidPauseToken('watch-1', null), false)
  assert.equal(isValidPauseToken('watch-1', 'forged'), false)
})

test('pause links are disabled when no secret is configured', () => {
  const token = (process.env.CRON_SECRET = 'test-secret', createPauseToken('watch-1'))
  delete process.env.CRON_SECRET
  assert.equal(createPauseToken('watch-1'), null)
  assert.equal(isValidPauseToken('watch-1', token), false)
})
