import { SupabaseClient } from '@supabase/supabase-js'
import { FlightResult } from '@/lib/types'
import { searchMockFlights } from './mock-provider'
import { searchSerpApiFlights } from './serpapi-provider'

const MONTHLY_SERPAPI_LIMIT = 240 // Safe threshold below 250 free quota
const CACHE_TTL_MINUTES = 60

export interface SearchOptions {
  origin: string
  destination: string
  date: string // YYYY-MM-DD
  nonStopOnly?: boolean
  forceRefresh?: boolean
}

export async function getFlightsForRoute(
  supabase: SupabaseClient,
  options: SearchOptions
): Promise<{ flights: FlightResult[]; fromCache: boolean; provider: 'serpapi' | 'mock' }> {
  const { origin, destination, date, nonStopOnly = false, forceRefresh = false } = options
  const cacheKey = `${origin.toUpperCase()}-${destination.toUpperCase()}-${date}-${nonStopOnly ? 'direct' : 'any'}`

  // 1. Check Search Cache (60 minutes)
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('search_cache')
      .select('results_json, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached && Array.isArray(cached.results_json) && cached.results_json.length > 0) {
      return {
        flights: cached.results_json as FlightResult[],
        fromCache: true,
        provider: cached.results_json[0]?.is_mock ? 'mock' : 'serpapi',
      }
    }
  }

  // 2. Check if SerpApi Key is configured
  const serpApiKey = process.env.SERPAPI_API_KEY
  const isKeyConfigured = Boolean(
    serpApiKey && serpApiKey.trim() !== '' && serpApiKey !== 'your-serpapi-key'
  )

  // 3. Fall back to mock provider ONLY if no API key is configured (local testing)
  if (!isKeyConfigured) {
    const flights = searchMockFlights(origin, destination, date, nonStopOnly)

    // Cache mock results
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
    await supabase
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        origin_code: origin.toUpperCase(),
        destination_code: destination.toUpperCase(),
        flight_date: date,
        is_non_stop_only: nonStopOnly,
        results_json: flights,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'cache_key' })

    return {
      flights,
      fromCache: false,
      provider: 'mock',
    }
  }

  // 4. In production (SERPAPI_API_KEY is configured): Check monthly usage quota
  const now = new Date()
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0]

  const { data: usageRows } = await supabase
    .from('usage')
    .select('serpapi_searches_count')
    .gte('usage_date', firstDayOfMonth)

  const totalUsedThisMonth = (usageRows || []).reduce(
    (sum, row) => sum + (row.serpapi_searches_count || 0),
    0
  )

  // When quota runs out, DO NOT fall back to mock provider. Skip the check and log it.
  if (totalUsedThisMonth >= MONTHLY_SERPAPI_LIMIT) {
    console.warn(
      `[SearchManager] SerpApi monthly quota reached limit (${totalUsedThisMonth}/${MONTHLY_SERPAPI_LIMIT}). Skipping price check for ${origin}→${destination} on ${date} to avoid emailing fake fares.`
    )
    return {
      flights: [],
      fromCache: false,
      provider: 'serpapi',
    }
  }

  // 5. Query SerpApi Google Flights API
  try {
    const flights = await searchSerpApiFlights(origin, destination, date, nonStopOnly)

    // Increment SerpApi usage for today
    const today = new Date().toISOString().split('T')[0]
    await supabase.rpc('increment_serpapi_usage', {
      p_date: today,
      p_count: 1,
    })

    // Cache successful results for 60 minutes
    if (flights.length > 0) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString()
      await supabase
        .from('search_cache')
        .upsert({
          cache_key: cacheKey,
          origin_code: origin.toUpperCase(),
          destination_code: destination.toUpperCase(),
          flight_date: date,
          is_non_stop_only: nonStopOnly,
          results_json: flights,
          cached_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, { onConflict: 'cache_key' })
    }

    return {
      flights,
      fromCache: false,
      provider: 'serpapi',
    }
  } catch (err) {
    // In production, log error and skip check. Never fall back to mock fares on failure.
    console.error(
      `[SearchManager] SerpApi search failed for ${origin}→${destination} on ${date}. Skipping check (no mock fallback in production):`,
      err
    )
    return {
      flights: [],
      fromCache: false,
      provider: 'serpapi',
    }
  }
}
