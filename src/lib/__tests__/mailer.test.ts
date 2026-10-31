import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterLiveAlertFlights, EmailAlertFlightPayload } from '../email/mailer'

const flight = {
  origin_code: 'BLR',
  destination_code: 'HYD',
  flight_date: '2026-12-15',
  airline: 'Example Airways',
  flight_number: 'EX-214',
  departure_time: '2026-12-15T06:15:00.000Z',
  arrival_time: '2026-12-15T07:30:00.000Z',
  duration_mins: 75,
  stops: 0,
  price: 2890,
  booking_url: 'https://example.com/flights',
}

test('simulated fares are excluded from email alerts', () => {
  const simulated: EmailAlertFlightPayload = {
    flight: { ...flight, is_mock: true },
  }
  const live: EmailAlertFlightPayload = {
    flight: { ...flight, is_mock: false },
  }

  assert.deepEqual(filterLiveAlertFlights([simulated, live]), [live])
  assert.deepEqual(filterLiveAlertFlights([simulated]), [])
})
