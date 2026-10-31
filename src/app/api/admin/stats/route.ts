import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUserAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  // 1. Total users
  const { count: usersCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 2. Total watches & active watches
  const { count: totalWatches } = await adminClient
    .from('watches')
    .select('*', { count: 'exact', head: true })

  const { count: activeWatches } = await adminClient
    .from('watches')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // 3. API searches this month
  const now = new Date()
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0]

  const { data: usageMonth } = await adminClient
    .from('usage')
    .select('serpapi_searches_count')
    .gte('usage_date', firstDayOfMonth)

  const apiSearchesMonth = (usageMonth || []).reduce(
    (sum, row) => sum + (row.serpapi_searches_count || 0),
    0
  )

  // 4. Emails sent today
  const today = new Date().toISOString().split('T')[0]
  const { data: todayUsage } = await adminClient
    .from('usage')
    .select('emails_sent_count')
    .eq('usage_date', today)
    .single()

  const emailsSentToday = todayUsage?.emails_sent_count || 0

  return NextResponse.json({
    stats: {
      totalUsers: usersCount || 0,
      totalWatches: totalWatches || 0,
      activeWatches: activeWatches || 0,
      apiSearchesMonth,
      emailsSentToday,
    },
  })
}
