import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const { data: openDay, error: odError } = await supabase
      .from('open_days')
      .select('*')
      .eq('id', id)
      .single()

    const { data: visitors } = await supabase
      .from('open_day_visitors')
      .select('*')
      .eq('open_day_id', id)
      .order('submitted_at', { ascending: false })

    if (odError) return Response.json({ error: odError.message }, { status: 500 })
    return Response.json({ openDay, visitors: visitors || [] })
  }

  const { data, error } = await supabase
    .from('open_days')
    .select('*')
    .order('event_date', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ openDays: data || [] })
}

export async function POST(req) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { action, payload } = body

  if (action === 'insert_open_day') {
    const { data, error } = await supabase
      .from('open_days')
      .insert([{ label: payload.label, event_date: payload.event_date }])
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, data })
  }

  if (action === 'delete_open_day') {
    const { error } = await supabase
      .from('open_days')
      .delete()
      .eq('id', payload.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  if (action === 'submit_visitor') {
    const { data, error } = await supabase
      .from('open_day_visitors')
      .insert([{
        open_day_id: payload.open_day_id,
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        date_of_birth: payload.date_of_birth || null,
        feedback: payload.feedback || null,
      }])
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, data })
  }

  if (action === 'delete_visitor') {
    const { error } = await supabase
      .from('open_day_visitors')
      .delete()
      .eq('id', payload.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  if (action === 'update_visitor') {
    const { id, ...rest } = payload
    const { error } = await supabase
      .from('open_day_visitors')
      .update(rest)
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}