import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateWatchPatch } from '@/lib/watch-validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch watch
  const { data: watch, error: watchError } = await supabase
    .from('watches')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (watchError || !watch) {
    return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
  }

  // Fetch price snapshots history for this watch
  const { data: snapshots } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('watch_id', id)
    .order('captured_at', { ascending: true })

  return NextResponse.json({
    watch,
    snapshots: snapshots || [],
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { data: current, error: currentError } = await supabase
    .from('watches')
    .select('is_active, rule_type, target_price, target_price_upper')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (currentError || !current) {
    return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
  }

  const result = validateWatchPatch(body, current)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  const updates = result.updates

  try {
    // If activating a paused watch, check 5 active limit
    if (updates.is_active === true && !current.is_active) {
      const { count } = await supabase
        .from('watches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (count !== null && count >= 5) {
        return NextResponse.json(
          { error: 'Cannot activate: You already have 5 active watches.' },
          { status: 400 }
        )
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: updatedWatch, error } = await supabase
      .from('watches')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ watch: updatedWatch })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid payload' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('watches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
