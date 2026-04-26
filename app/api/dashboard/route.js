import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const { errorResponse, user } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  try {
    const [
      { data: profile },
      { data: applicants },
      { data: completions },
      { data: students },
      { data: contacts },
      { data: visits },
      { data: completedApplicants }
    ] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('applicants').select('id, is_matched, is_archived, status'),
      supabase.from('visit_completions').select('*'),
      supabase.from('visit_students').select('id'),
      supabase.from('contacts').select('id'),
      supabase.from('school_visits').select('*').order('visit_date', { ascending: true }),
      supabase.from('completed_applicants').select('school_name')
    ])
    return NextResponse.json({
      profile: profile || null,
      stats: {
        totalApplicants: applicants?.filter(a => !a.is_archived && !a.is_matched).length || 0, 
        completedApplicants: applicants?.filter(a => a.is_archived || a.is_matched).length || 0, 
        totalVisits: completions?.length || 0,
        totalVisitStudents: students?.length || 0,
        totalContacts: contacts?.length || 0,
        matchedApplicants: applicants?.filter(a => a.is_matched).length || 0,
      },
      allVisits: visits || [],
      completions: completions || [],
      completedApplicantSchools: completedApplicants?.map(a => a.school_name).filter(Boolean) || []
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}