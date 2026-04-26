// app/api/budget/route.js

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

// GET /api/budget — list all budget requests
export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('budget_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

// POST /api/budget
// body: { action, payload }
// action: 'create' | 'update' | 'delete'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'create') {
    const { visitType, companion, date, hourFrom, hourTo, costFields, total, notes } = payload

    const { data, error } = await supabase
      .from('budget_requests')
      .insert([{
        visit_type:  visitType,
        companion:   companion || null,
        date:        date,
        hour_from:   hourFrom || null,
        hour_to:     hourTo || null,
        cost_fields: costFields,
        total:       total,
        notes:       notes || null,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Created budget request', 'budget_request', visitType, `JD ${total}`)
    return NextResponse.json({ request: data })
  }

  if (action === 'update') {
    const { id, visitType, companion, date, hourFrom, hourTo, costFields, total, notes } = payload

    const { data, error } = await supabase
      .from('budget_requests')
      .update({
        visit_type:  visitType,
        companion:   companion || null,
        date:        date,
        hour_from:   hourFrom || null,
        hour_to:     hourTo || null,
        cost_fields: costFields,
        total:       total,
        notes:       notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Updated budget request', 'budget_request', visitType, `JD ${total}`)
    return NextResponse.json({ request: data })
  }

  if (action === 'delete') {
    const { id, visitType } = payload
    const { error } = await supabase.from('budget_requests').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted budget request', 'budget_request', visitType, 'Request removed')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}