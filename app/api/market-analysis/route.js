import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('market_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data })
}

export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'create') {
    const { data, error } = await supabase
      .from('market_reports')
      .insert([payload])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Created market report', 'market_report', payload.country, `Mode: ${payload.mode}`)
    return NextResponse.json({ report: data })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    rest.last_updated = new Date().toISOString()
    const { error } = await supabase
      .from('market_reports')
      .update(rest)
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Updated market report', 'market_report', rest.country ?? id, 'Report metadata updated')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, country } = payload
    const { error } = await supabase
      .from('market_reports')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted market report', 'market_report', country, 'Report and all sections deleted')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}