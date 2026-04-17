// app/api/visit-students/route.js
// Returns visit_students joined with school_visits for the visit-students dashboard page.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const [
    { data: students, error: se }, 
    { data: visits, error: ve }, 
    { data: completions, error: ce } // Added completion fetch
  ] = await Promise.all([
    supabase.from('visit_students').select('*').order('id', { ascending: false }),
    supabase.from('school_visits').select('id, school_name, visit_date'),
    supabase.from('visit_completions').select('*'), // This fetches the "Done" records
  ])

  if (se) return NextResponse.json({ error: se.message }, { status: 500 })
  if (ve) return NextResponse.json({ error: ve.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 }) // Error check for completions

  // Return all three arrays to the frontend
  return NextResponse.json({ students, visits, completions })
}

// action: 'update' | 'delete'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'update') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('visit_students').update(rest).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited visit student', 'visit_student', rest.full_name, 'Student record updated')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, full_name } = payload
    const { error } = await supabase.from('visit_students').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted visit student', 'visit_student', full_name, 'Student record removed')
    return NextResponse.json({ success: true })
  }
  if (action === 'insert') {
    const { error } = await supabase.from('visit_students').insert([payload])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Added visit student', 'visit_student', payload.full_name, 'New student collected')
    return NextResponse.json({ success: true })
  }

  if (action === 'import') {
    const { error } = await supabase.from('visit_students').insert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Imported visit students', 'visit_student', 'Excel Import', `Imported ${payload.length} students`)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

}