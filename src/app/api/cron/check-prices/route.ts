import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPriceCheckJob } from '@/lib/cron/price-checker'

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  // If no secret configured in development, allow
  if (!cronSecret || cronSecret === 'your-random-cron-secret-32-chars') {
    if (process.env.NODE_ENV === 'development') {
      return true
    }
  }

  // Check Authorization header (Bearer <secret>)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token === cronSecret) return true
  }

  // Check x-cron-secret header
  const customHeader = request.headers.get('x-cron-secret')
  if (customHeader === cronSecret) return true

  // Check query parameter for manual browser triggers: ?secret=<CRON_SECRET>
  const querySecret = request.nextUrl.searchParams.get('secret')
  if (querySecret && querySecret === cronSecret) return true

  return false
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing CRON_SECRET' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const summary = await runPriceCheckJob(supabase)
    return NextResponse.json({
      // false when any watch failed, so the scheduler can flag partial failures
      success: summary.errors.length === 0,
      timestamp: new Date().toISOString(),
      summary,
    })
  } catch (error) {
    console.error('[CronAPI] Execution failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown price check error',
      },
      { status: 500 }
    )
  }
}

// Support GET for testing and Vercel Cron triggers
export async function GET(request: NextRequest) {
  return POST(request)
}
