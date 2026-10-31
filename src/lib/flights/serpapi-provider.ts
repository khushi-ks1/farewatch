import { FlightResult } from '@/lib/types'

interface SerpApiFlightLeg {
  airline?: string
  flight_number?: string
  departure_airport?: {
    name?: string
    id?: string
    time?: string
  }
  arrival_airport?: {
    name?: string
    id?: string
    time?: string
  }
  duration?: number
}

interface SerpApiFlightItem {
  flights?: SerpApiFlightLeg[]
  total_duration?: number
  price?: number
  booking_token?: string
}

interface SerpApiResponse {
  best_flights?: SerpApiFlightItem[]
  other_flights?: SerpApiFlightItem[]
  search_metadata?: {
    google_flights_url?: string
  }
  error?: string
}

export async function searchSerpApiFlights(
  origin: string,
  destination: string,
  dateStr: string,
  nonStopOnly: boolean = false
): Promise<FlightResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY is not configured')
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin.toUpperCase(),
    arrival_id: destination.toUpperCase(),
    outbound_date: dateStr,
    currency: 'INR',
    gl: 'in',
    hl: 'en',
    type: '2', // One-way
    api_key: apiKey,
  })

  if (nonStopOnly) {
    params.set('stops', '1') // 1 represents Non-stop in Google Flights SerpApi
  }

  const url = `https://serpapi.com/search.json?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    // Next.js cache control
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`SerpApi request failed with status ${response.status}: ${errorText}`)
  }

  const data: SerpApiResponse = await response.json()

  if (data.error) {
    throw new Error(`SerpApi error: ${data.error}`)
  }

  const fallbackBookingUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${dateStr}%20one%20way`
  const bookingUrl = data.search_metadata?.google_flights_url || fallbackBookingUrl

  const combinedFlights = [...(data.best_flights || []), ...(data.other_flights || [])]

  const results: FlightResult[] = []

  for (const item of combinedFlights) {
    if (!item.flights || item.flights.length === 0 || typeof item.price !== 'number') {
      continue
    }

    const firstLeg = item.flights[0]
    const lastLeg = item.flights[item.flights.length - 1]
    const stops = Math.max(0, item.flights.length - 1)

    // Skip if nonStopOnly requested but stops > 0
    if (nonStopOnly && stops > 0) {
      continue
    }

    const airline = firstLeg.airline || 'Domestic Airline'
    const flightNum = firstLeg.flight_number || 'FL-000'
    const depTime = firstLeg.departure_airport?.time || `${dateStr}T08:00:00`
    const arrTime = lastLeg.arrival_airport?.time || `${dateStr}T10:00:00`
    const duration = item.total_duration || 90

    results.push({
      origin_code: origin.toUpperCase(),
      destination_code: destination.toUpperCase(),
      flight_date: dateStr,
      airline,
      flight_number: flightNum,
      departure_time: depTime,
      arrival_time: arrTime,
      duration_mins: duration,
      stops,
      price: item.price,
      booking_url: bookingUrl,
      is_mock: false,
    })
  }

  // Sort cheapest first
  return results.sort((a, b) => a.price - b.price)
}
