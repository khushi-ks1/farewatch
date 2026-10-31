import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidPauseToken } from '@/lib/pause-token'

// "Pause this watch" link from alert emails. It works without signing in, so:
// - it requires the signed token we put in the email (knowing a watch id is not enough), and
// - GET only shows a confirm page; the actual pause is a POST from that page,
//   so email link scanners that pre-open links can't pause anything.

const INVALID_LINK_MESSAGE =
  'This%20pause%20link%20is%20invalid.%20Sign%20in%20to%20pause%20the%20watch%20from%20your%20dashboard.'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const origin = request.nextUrl.origin
  const token = request.nextUrl.searchParams.get('token')

  if (!isValidPauseToken(id, token)) {
    return NextResponse.redirect(`${origin}/dashboard?message=${INVALID_LINK_MESSAGE}`)
  }

  const action = `${origin}/api/watches/${encodeURIComponent(id)}/pause`
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Pause watch · FareWatch</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111112;">
  <form method="POST" action="${escapeHtml(action)}" style="background:#fff;border:1px solid #e6e5e2;border-radius:10px;padding:28px;max-width:360px;margin:16px;text-align:left;">
    <h1 style="font-size:20px;font-weight:600;letter-spacing:-0.02em;margin:0 0 6px;">Pause this flight watch?</h1>
    <p style="font-size:14px;color:#66666c;line-height:1.5;margin:0 0 20px;">You'll stop getting price alerts for it. You can turn it back on from your dashboard any time.</p>
    <input type="hidden" name="token" value="${escapeHtml(token as string)}">
    <button type="submit" style="width:100%;height:40px;border:0;border-radius:6px;background:#111112;color:#fafaf9;font-size:14px;font-weight:500;cursor:pointer;">Pause watch</button>
  </form>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const origin = request.nextUrl.origin

  let token: string | null = null
  try {
    const form = await request.formData()
    const value = form.get('token')
    token = typeof value === 'string' ? value : null
  } catch {
    token = null
  }

  if (!isValidPauseToken(id, token)) {
    return NextResponse.redirect(`${origin}/dashboard?message=${INVALID_LINK_MESSAGE}`, 303)
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('watches')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(`${origin}/dashboard?message=Failed%20to%20pause%20watch`, 303)
  }

  return NextResponse.redirect(`${origin}/dashboard?message=Watch%20paused%20successfully`, 303)
}
