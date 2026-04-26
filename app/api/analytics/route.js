// app/api/analytics/route.js
// Aggregates data from multiple tables for the analytics dashboard page.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const [
    { data: visits },
    { data: completions },
    { data: students },
    { data: applicants },
    { data: contacts },
    { data: tasks },
    { data: completedApplicants },
  ] = await Promise.all([
    supabase.from('school_visits').select('*'),
    supabase.from('visit_completions').select('*'),
    supabase.from('visit_students').select('*'),
    supabase.from('applicants').select('*'),
    supabase.from('contacts').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('completed_applicants').select('school_name, major'),
  ])

  return NextResponse.json({ visits, completions, students, applicants, contacts, tasks, completedApplicants })
}