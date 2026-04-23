import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET(req, { params }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { id } = await params

  const [
    { data: report, error: re },
    { data: sections, error: se },
    { data: cities, error: ce },
  ] = await Promise.all([
    supabase.from('market_reports').select('*').eq('id', id).single(),
    supabase.from('report_sections').select('*').eq('report_id', id),
    supabase.from('report_cities').select('*').eq('report_id', id).order('created_at', { ascending: true }),
  ])

  if (re) return NextResponse.json({ error: re.message }, { status: 500 })
  if (se) return NextResponse.json({ error: se.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  return NextResponse.json({ report, sections: sections ?? [], cities: cities ?? [] })
}

export async function POST(req, { params }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { id } = await params
  const { action, payload } = await req.json()

  if (action === 'upsert_section') {
    const { data: existing } = await supabase
      .from('report_sections')
      .select('id')
      .eq('report_id', id)
      .eq('section_type', payload.section_type)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('report_sections')
        .update({ content: payload.content, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase
        .from('report_sections')
        .insert([{ report_id: id, section_type: payload.section_type, content: payload.content }])
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'add_city') {
    const { data, error } = await supabase
      .from('report_cities')
      .insert([{ report_id: id, city_name: payload.city_name, content: payload.content ?? {} }])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Added city to report', 'market_report', payload.city_name, `Added to report ${id}`)
    return NextResponse.json({ city: data })
  }

  if (action === 'update_city') {
    const { city_id, ...rest } = payload
    const { error } = await supabase
      .from('report_cities')
      .update({ city_name: rest.city_name, content: rest.content })
      .eq('id', city_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_city') {
    const { city_id, city_name } = payload
    const { error } = await supabase
      .from('report_cities')
      .delete()
      .eq('id', city_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Removed city from report', 'market_report', city_name, `Removed from report ${id}`)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}