import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAirportByCode } from '@/lib/airports'
import { getFlightsForRoute } from '@/lib/flights/search-manager'

const MAX_ACTIVE_WATCHES = 5

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: watches, error } = await supabase
    .from('watches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ watches })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      origin_code,
      destination_code,
      departure_date_start,
      departure_date_end,
      rule_type,
      target_price,
      target_price_upper,
      is_non_stop_only = false,
    } = body

    // 1. Validate inputs
    if (!origin_code || !destination_code || !departure_date_start || !rule_type || !target_price) {
      return NextResponse.json({ error: 'Missing required watch parameters' }, { status: 400 })
    }

    if (origin_code.toUpperCase() === destination_code.toUpperCase()) {
      return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 })
    }

    const originAirport = getAirportByCode(origin_code)
    const destAirport = getAirportByCode(destination_code)

    if (!originAirport || !destAirport) {
      return NextResponse.json({ error: 'Invalid airport code' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    if (departure_date_start < today) {
      return NextResponse.json({ error: 'Travel date cannot be in the past' }, { status: 400 })
    }

    if (departure_date_end && departure_date_end < departure_date_start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    if (rule_type === 'BETWEEN' && (!target_price_upper || target_price_upper <= target_price)) {
      return NextResponse.json({ error: 'Upper target price must be higher than lower target price' }, { status: 400 })
    }

    // 2. Check 5 active watches limit
    const { count, error: countError } = await supabase
      .from('watches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (count !== null && count >= MAX_ACTIVE_WATCHES) {
      return NextResponse.json(
        { error: `Limit reached: You can have at most ${MAX_ACTIVE_WATCHES} active watches. Please pause or delete an existing watch.` },
        { status: 400 }
      )
    }

    // 3. Insert Watch
    const { data: newWatch, error: insertError } = await supabase
      .from('watches')
      .insert({
        user_id: user.id,
        origin_code: origin_code.toUpperCase(),
        origin_city: originAirport.city,
        destination_code: destination_code.toUpperCase(),
        destination_city: destAirport.city,
        departure_date_start,
        departure_date_end: departure_date_end || null,
        rule_type,
        target_price: Number(target_price),
        target_price_upper: rule_type === 'BETWEEN' ? Number(target_price_upper) : null,
        is_non_stop_only: Boolean(is_non_stop_only),
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 4. Initial immediate price search in background to populate snapshot & current lowest price
    try {
      const adminSupabase = createAdminClient()
      const searchResult = await getFlightsForRoute(adminSupabase, {
        origin: newWatch.origin_code,
        destination: newWatch.destination_code,
        date: newWatch.departure_date_start,
        nonStopOnly: newWatch.is_non_stop_only,
      })

      if (searchResult.flights.length > 0) {
        const lowest = searchResult.flights[0]
        await adminSupabase.from('price_snapshots').insert({
          watch_id: newWatch.id,
          origin_code: newWatch.origin_code,
          destination_code: newWatch.destination_code,
          flight_date: newWatch.departure_date_start,
          airline: lowest.airline,
          flight_number: lowest.flight_number,
          departure_time: lowest.departure_time,
          arrival_time: lowest.arrival_time,
          duration_mins: lowest.duration_mins,
          stops: lowest.stops,
          price: lowest.price,
          booking_url: lowest.booking_url,
          is_mock: Boolean(lowest.is_mock),
        })

        await adminSupabase
          .from('watches')
          .update({
            last_checked_at: new Date().toISOString(),
            current_lowest_price: lowest.price,
          })
          .eq('id', newWatch.id)

        newWatch.current_lowest_price = lowest.price
        newWatch.last_checked_at = new Date().toISOString()
      }
    } catch (searchErr) {
      console.warn('[WatchesPOST] Immediate search error (non-fatal):', searchErr)
    }

    return NextResponse.json({ watch: newWatch }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request payload' },
      { status: 500 }
    )
  }
}
