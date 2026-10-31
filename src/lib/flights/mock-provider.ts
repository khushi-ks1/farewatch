import { FlightResult } from '@/lib/types'

// Realistic airlines operating domestic flights in India
const AIRLINES = [
  { name: 'IndiGo', code: '6E', baseFare: 3200 },
  { name: 'Air India', code: 'AI', baseFare: 3900 },
  { name: 'Air India Express', code: 'IX', baseFare: 3100 },
  { name: 'Akasa Air', code: 'QP', baseFare: 3050 },
  { name: 'SpiceJet', code: 'SG', baseFare: 3350 },
]

// Common flight schedules throughout the day
const FLIGHT_SCHEDULES = [
  { depHour: 6, depMin: 15, durationMins: 75, flightNumSuffix: '214' },
  { depHour: 8, depMin: 45, durationMins: 80, flightNumSuffix: '422' },
  { depHour: 11, depMin: 30, durationMins: 70, flightNumSuffix: '651' },
  { depHour: 14, depMin: 10, durationMins: 85, flightNumSuffix: '803' },
  { depHour: 17, depMin: 25, durationMins: 75, flightNumSuffix: '519' },
  { depHour: 19, depMin: 50, durationMins: 90, flightNumSuffix: '934' },
  { depHour: 22, depMin: 15, durationMins: 80, flightNumSuffix: '107' },
]

// Simple deterministic hash based on route and date to give consistent but varying realistic fares
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function searchMockFlights(
  origin: string,
  destination: string,
  dateStr: string, // YYYY-MM-DD
  nonStopOnly: boolean = false
): FlightResult[] {
  const seed = hashString(`${origin}-${destination}-${dateStr}`)
  const results: FlightResult[] = []

  // Generate 4-7 flights for this route and date
  const numFlights = 4 + (seed % 4)

  for (let i = 0; i < numFlights; i++) {
    const airline = AIRLINES[(seed + i) % AIRLINES.length]
    const schedule = FLIGHT_SCHEDULES[(seed + i * 2) % FLIGHT_SCHEDULES.length]
    const isStop = !nonStopOnly && (seed + i) % 5 === 0 // occasional 1-stop if not non-stop only

    // Dynamic price calculation based on airline base + distance approx + seed variation
    const daySeed = (seed * (i + 1)) % 1000
    // Price fluctuation between -₹400 and +₹1200
    const priceVar = ((daySeed % 16) - 4) * 100
    const finalPrice = Math.max(2200, airline.baseFare + priceVar)

    // Departure and arrival IST timestamps
    const [year, month, day] = dateStr.split('-').map(Number)
    const depDate = new Date(Date.UTC(year, month - 1, day, schedule.depHour, schedule.depMin))
    const totalDuration = isStop ? schedule.durationMins + 120 : schedule.durationMins
    const arrDate = new Date(depDate.getTime() + totalDuration * 60 * 1000)

    const googleFlightsUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${dateStr}%20one%20way`

    results.push({
      origin_code: origin.toUpperCase(),
      destination_code: destination.toUpperCase(),
      flight_date: dateStr,
      airline: airline.name,
      flight_number: `${airline.code}-${schedule.flightNumSuffix}`,
      departure_time: depDate.toISOString(),
      arrival_time: arrDate.toISOString(),
      duration_mins: totalDuration,
      stops: isStop ? 1 : 0,
      price: finalPrice,
      booking_url: googleFlightsUrl,
      is_mock: true,
    })
  }

  // Sort cheapest first
  return results.sort((a, b) => a.price - b.price)
}
