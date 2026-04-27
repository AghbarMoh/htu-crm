import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req, { params }) {
  const { years } = await params
  const year = years
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Get cohort by year
  const { data: cohort, error: cohortError } = await supabase
    .from('previous_year_cohorts')
    .select('id, label, year, total_imported')
    .eq('year', year)
    .single()

  if (cohortError) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })

  let query = supabase
    .from('previous_year_students')
    .select('*', { count: 'exact' })
    .eq('cohort_id', cohort.id)
    .order('english_name', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.or(`english_name.ilike.%${search}%,major.ilike.%${search}%,school.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cohort, students: data, total: count, page, limit })
}