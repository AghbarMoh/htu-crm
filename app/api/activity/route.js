// app/api/activity/route.js
// Returns activity_log entries. Also accepts POST to log from client components.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/activity — client components call this to log activity
// (replaces direct logActivity() calls from 'use client' components that used the browser client)
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const { action, entity_type, entity_name, details } = await req.json()

  const { error } = await supabase.from('activity_log').insert([{
    action,
    entity_type,
    entity_name,
    details,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} // <-- THIS IS THE MISSING BRACKET THAT CLOSES THE POST FUNCTION!

export async function DELETE(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  
  // Get URL parameters to check if we are deleting one or all
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const deleteAll = url.searchParams.get('all') === 'true'

  let error;

  if (deleteAll) {
    // Delete all except a dummy ID (or just delete all depending on your DB rules)
    const { error: err } = await supabase.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    error = err
  } else if (id) {
    // Delete specific ID
    const { error: err } = await supabase.from('activity_log').delete().eq('id', id)
    error = err
  } else {
    return NextResponse.json({ error: "Missing ID or 'all' flag" }, { status: 400 })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
