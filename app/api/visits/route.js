// app/api/visits/route.js
// Handles all school_visits, visit_completions, and visit_students reads/writes.
// Replaces all direct supabase calls from app/dashboard/school-visits/page.js

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

// GET /api/visits
// Returns all school_visits + their completions + student counts
export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const [{ data: visits, error: ve }, { data: completions, error: ce }, { data: students, error: se }] =
    await Promise.all([
      supabase.from('school_visits').select('*').order('visit_date', { ascending: true }).order('visit_time', { ascending: true }),
      supabase.from('visit_completions').select('*'),
      supabase.from('visit_students').select('*'),
    ])

  if (ve) return NextResponse.json({ error: ve.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })
  if (se) return NextResponse.json({ error: se.message }, { status: 500 })

  return NextResponse.json({ visits, completions, students })
}

// POST /api/visits
// body: { action, payload }
// action: 'insert' | 'update' | 'delete' | 'complete' | 'undo_complete' | 'update_qstash'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { data, error } = await supabase.from('school_visits').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Created school visit', 'school_visit', payload.school_name, 'New visit added')
    return NextResponse.json({ data })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { data, error } = await supabase.from('school_visits').update(rest).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited school visit', 'school_visit', rest.school_name, 'Updated visit details')
    return NextResponse.json({ data })
  }

  if (action === 'delete') {
    const { id, school_name } = payload
    const { error } = await supabase.from('school_visits').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted school visit', 'school_visit', school_name, 'School visit removed')
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const { visit_id, comment, images, school_name } = payload
    const { error } = await supabase.from('visit_completions').upsert(
      { visit_id, comment, images },
      { onConflict: 'visit_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Completed school visit', 'school_visit', school_name, comment)
    return NextResponse.json({ success: true })
  }

  if (action === 'undo_complete') {
    const { visit_id, school_name } = payload
    const { error } = await supabase.from('visit_completions').delete().eq('visit_id', visit_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Undid visit completion', 'school_visit', school_name, 'Moved back to pending')
    return NextResponse.json({ success: true })
  }

  if (action === 'update_qstash') {
    // Called after scheduling a reminder to save the QStash message ID
    const { id, qstash_message_id } = payload
    const { error } = await supabase.from('school_visits').update({ qstash_message_id }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}