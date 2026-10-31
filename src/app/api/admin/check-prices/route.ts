import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUserAdmin } from '@/lib/admin'
import { runPriceCheckJob } from '@/lib/cron/price-checker'

// Manual "Trigger Price Check" from the admin dashboard.
// Authorized by the signed-in user's session (must be in ADMIN_EMAILS),
// so CRON_SECRET never has to reach the browser.
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUserAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 })
  }

  try {
    const summary = await runPriceCheckJob(createAdminClient())
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    })
  } catch (error) {
    console.error('[AdminPriceCheck] Execution failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown price check error',
      },
      { status: 500 }
    )
  }
}
