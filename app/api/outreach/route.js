import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

// GET — returns outreach visits in budget-compatible format
export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const [{ data: visits, error: ve }, { data: completions, error: ce }] = await Promise.all([
    supabase.from('outreach_visits').select('*').order('date_from', { ascending: true }),
    supabase.from('outreach_completions').select('*'),
  ])

  if (ve) return NextResponse.json({ error: ve.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  // Map to budget-page-compatible format (school_name + visit_date)
  const mapped = (visits || []).map(v => ({
    ...v,
    school_name: v.name,
    visit_date: v.date_from,
  }))

  return NextResponse.json({ visits: mapped, completions: completions || [] })
}

// POST — CRUD for outreach visits
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { data, error } = await supabase.from('outreach_visits').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Created outreach visit', 'outreach', payload.name, `Type: ${payload.type}`)
    return NextResponse.json({ data })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { data, error } = await supabase.from('outreach_visits').update(rest).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited outreach visit', 'outreach', rest.name || id, 'Updated details')
    return NextResponse.json({ data })
  }

  if (action === 'delete') {
    const { id, name } = payload
    const { error } = await supabase.from('outreach_visits').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted outreach visit', 'outreach', name, 'Removed')
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const { visit_id, comment, images, name } = payload
    const { error } = await supabase.from('outreach_completions').upsert(
      { visit_id, comment, images },
      { onConflict: 'visit_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Completed outreach visit', 'outreach', name, comment)
    return NextResponse.json({ success: true })
  }

  if (action === 'undo_complete') {
    const { visit_id, name } = payload
    const { error } = await supabase.from('outreach_completions').delete().eq('visit_id', visit_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Undid outreach completion', 'outreach', name, 'Moved back to pending')
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    const { id, name } = payload
    const { error } = await supabase.from('outreach_visits').update({ is_cancelled: true }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Cancelled outreach visit', 'outreach', name, 'Marked as cancelled')
    return NextResponse.json({ success: true })
  }

  if (action === 'uncancel') {
    const { id, name } = payload
    const { error } = await supabase.from('outreach_visits').update({ is_cancelled: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Restored outreach visit', 'outreach', name, 'Cancelled visit restored')
    return NextResponse.json({ success: true })
  }

  if (action === 'save_report') {
    const { visit_id, report_data } = payload
    const { error } = await supabase
      .from('outreach_completions')
      .update({ report_data })
      .eq('visit_id', visit_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}