// app/api/contacts/route.js
// Handles all contacts table operations.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// action: 'insert' | 'update' | 'delete'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { error } = await supabase.from('contacts').insert([payload])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Added contact', 'contact', payload.full_name, 'New contact added')
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('contacts').update(rest).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited contact', 'contact', rest.full_name, 'Contact updated')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, full_name } = payload
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted contact', 'contact', full_name, 'Contact removed')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}