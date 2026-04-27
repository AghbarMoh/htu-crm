import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  const supabase = createServiceClient()

  const { data: companions, error } = await supabase
    .from('companions')
    .select('*, companion_evaluations(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: companions })
}

export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { data, error } = await supabase.from('companions').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Added companion', 'companion', payload.name, 'New companion added')
    return NextResponse.json({ success: true, data })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('companions').update(rest).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Updated companion', 'companion', payload.name, 'Companion updated')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, name } = payload
    const { error } = await supabase.from('companions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted companion', 'companion', name, 'Companion removed')
    return NextResponse.json({ success: true })
  }

  if (action === 'evaluate') {
    const { companion_id, companion_name, ...evaluation } = payload
    const { data: existing } = await supabase
      .from('companion_evaluations')
      .select('id')
      .eq('companion_id', companion_id)
      .maybeSingle()

    let result
    if (existing) {
      result = await supabase
        .from('companion_evaluations')
        .update({ ...evaluation, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      result = await supabase
        .from('companion_evaluations')
        .insert([{ companion_id, ...evaluation }])
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    await logActivity('Evaluated companion', 'companion', companion_name, 'Evaluation updated')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}