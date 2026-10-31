import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('watches')
    .update({ is_active: false })
    .eq('id', id)

  const origin = request.nextUrl.origin

  if (error) {
    return NextResponse.redirect(`${origin}/dashboard?message=Failed%20to%20pause%20watch`)
  }

  return NextResponse.redirect(`${origin}/dashboard?message=Watch%20paused%20successfully`)
}
