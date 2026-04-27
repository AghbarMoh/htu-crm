import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('previous_year_cohorts')
    .select('*')
    .order('year', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req) {
  const { label, year } = await req.json()

  if (!label || !year) return NextResponse.json({ error: 'label and year are required' }, { status: 400 })

  const { data, error } = await supabase
    .from('previous_year_cohorts')
    .insert({ label, year })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}