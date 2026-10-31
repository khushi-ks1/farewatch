import { SupabaseClient } from '@supabase/supabase-js'
import { Watch } from '@/lib/types'
import { getFlightsForRoute } from '@/lib/flights/search-manager'
import { sendPriceAlertEmail, EmailAlertFlightPayload } from '@/lib/email/mailer'
import { MAX_RANGE_DAYS } from '@/lib/watch-validation'

export interface CronCheckSummary {
  watchesChecked: number
  expiredWatches: number
  totalSnapshotsSaved: number
  emailsSent: number
  errors: string[]
}

// Generate date strings between startDate and endDate (inclusive)
export function getDatesInRange(startStr: string, endStr?: string | null): string[] {
  const dates: string[] = []
  const start = new Date(startStr)
  const end = endStr ? new Date(endStr) : new Date(startStr)

  // Cap range at maximum 30 days to avoid runaway searches
  const maxDays = MAX_RANGE_DAYS
  let count = 0

  const current = new Date(start)
  while (current <= end && count < maxDays) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
    count++
  }

  return dates
}

export async function runPriceCheckJob(supabase: SupabaseClient): Promise<CronCheckSummary> {
  const summary: CronCheckSummary = {
    watchesChecked: 0,
    expiredWatches: 0,
    totalSnapshotsSaved: 0,
    emailsSent: 0,
    errors: [],
  }

  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch all active watches with user profiles
  const { data: watches, error: watchError } = await supabase
    .from('watches')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .eq('is_active', true)

  if (watchError || !watches) {
    summary.errors.push(`Failed to fetch active watches: ${watchError?.message}`)
    return summary
  }

  for (const watch of watches as (Watch & { profiles: { email: string; full_name: string | null } })[]) {
    try {
      // 2. Check for expired travel date
      const lastTravelDate = watch.departure_date_end || watch.departure_date_start
      if (lastTravelDate < today) {
        // Expire watch
        await supabase
          .from('watches')
          .update({ is_active: false })
          .eq('id', watch.id)
        summary.expiredWatches++
        continue
      }

      const datesToCheck = getDatesInRange(watch.departure_date_start, watch.departure_date_end)
      let overallLowestPrice: number | null = watch.current_lowest_price
      const alertableFlights: EmailAlertFlightPayload[] = []

      for (const flightDate of datesToCheck) {
        // Skip past dates if date range started in the past
        if (flightDate < today) continue

        // 3. Search flights (cached for 60 min across all users)
        const { flights } = await getFlightsForRoute(supabase, {
          origin: watch.origin_code,
          destination: watch.destination_code,
          date: flightDate,
          nonStopOnly: watch.is_non_stop_only,
        })

        if (!flights || flights.length === 0) continue

        const cheapestForDate = flights[0]

        // Update overall lowest price
        if (overallLowestPrice === null || cheapestForDate.price < overallLowestPrice) {
          overallLowestPrice = cheapestForDate.price
        }

        // 4. Save cheapest snapshot for this watch
        await supabase.from('price_snapshots').insert({
          watch_id: watch.id,
          origin_code: watch.origin_code,
          destination_code: watch.destination_code,
          flight_date: flightDate,
          airline: cheapestForDate.airline,
          flight_number: cheapestForDate.flight_number,
          departure_time: cheapestForDate.departure_time,
          arrival_time: cheapestForDate.arrival_time,
          duration_mins: cheapestForDate.duration_mins,
          stops: cheapestForDate.stops,
          price: cheapestForDate.price,
          booking_url: cheapestForDate.booking_url,
          is_mock: Boolean(cheapestForDate.is_mock),
        })
        summary.totalSnapshotsSaved++

        // 5. Evaluate matching flights for alert rules
        for (const flight of flights) {
          let matchesRule = false
          if (watch.rule_type === 'BELOW') {
            matchesRule = flight.price <= watch.target_price
          } else if (watch.rule_type === 'BETWEEN') {
            const upper = watch.target_price_upper ?? watch.target_price
            matchesRule = flight.price >= watch.target_price && flight.price <= upper
          }

          if (!matchesRule) continue

          // 6. Check deduplication in `alerts` table
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('*')
            .eq('watch_id', watch.id)
            .eq('flight_number', flight.flight_number)
            .eq('flight_date', flight.flight_date)
            .single()

          if (existingAlert) {
            // Only alert again if the price dropped by 5% or more
            const dropThreshold = existingAlert.last_alert_price * 0.95
            if (flight.price <= dropThreshold) {
              alertableFlights.push({
                flight,
                previousPrice: existingAlert.last_alert_price,
              })
            }
          } else {
            // First time this flight matches
            alertableFlights.push({ flight })
          }
        }
      }

      // Update watch status & lowest price
      await supabase
        .from('watches')
        .update({
          last_checked_at: new Date().toISOString(),
          current_lowest_price: overallLowestPrice,
        })
        .eq('id', watch.id)

      summary.watchesChecked++

      // 7. Send consolidated email if matches found
      if (alertableFlights.length > 0 && watch.profiles?.email) {
        // Sort cheapest first
        alertableFlights.sort((a, b) => a.flight.price - b.flight.price)

        // Only include top 5 deals in single email to keep it punchy
        const topDeals = alertableFlights.slice(0, 5)

        const emailResult = await sendPriceAlertEmail(
          supabase,
          watch.profiles.email,
          watch,
          topDeals
        )

        if (emailResult.success) {
          summary.emailsSent++

          // Update alerts table with sent prices
          for (const item of topDeals) {
            await supabase
              .from('alerts')
              .upsert(
                {
                  watch_id: watch.id,
                  user_id: watch.user_id,
                  flight_number: item.flight.flight_number,
                  flight_date: item.flight.flight_date,
                  airline: item.flight.airline,
                  last_alert_price: item.flight.price,
                  last_alerted_at: new Date().toISOString(),
                },
                { onConflict: 'watch_id,flight_number,flight_date' }
              )
          }
        } else if (emailResult.skippedReason) {
          console.log(`[PriceChecker] Email skipped for watch ${watch.id}: ${emailResult.skippedReason}`)
        }
      }
    } catch (watchErr) {
      const msg = `Error checking watch ${watch.id}: ${watchErr}`
      console.error(msg)
      summary.errors.push(msg)
    }
  }

  return summary
}
