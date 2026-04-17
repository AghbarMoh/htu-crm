// app/api/agent/get-visits/route.js  (REPLACE existing file)
// Protected — requires authenticated session
// Uses service key instead of anon key

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const [
    { data: visits, error: visitsError },
    { data: completions, error: completionsError },
    { data: students, error: studentsError },
  ] = await Promise.all([
    supabase.from('school_visits').select('*').order('visit_date', { ascending: true }),
    supabase.from('visit_completions').select('*'),
    supabase.from('visit_students').select('visit_id'),
  ])

  if (visitsError) throw visitsError
  if (completionsError) throw completionsError
  if (studentsError) throw studentsError

  const formattedData = (visits || []).map(visit => {
    const completionRecord = (completions || []).find(c => c.visit_id === visit.id)
    const studentCount = (students || []).filter(s => s.visit_id === visit.id).length
    return {
      id: visit.id,
      schoolName: visit.school_name,
      visitDate: visit.visit_date,
      visitTime: visit.visit_time,
      type: visit.type,
      schoolType: visit.private_or_public,
      city: visit.city,
      connectionStatus: visit.connection_status,
      companion: visit.companion,
      status: completionRecord ? 'Completed' : 'Pending',
      accomplishments: completionRecord ? completionRecord.comment : null,
      studentsCollected: studentCount,
    }
  })

  return NextResponse.json({
    success: true,
    totalVisits: formattedData.length,
    visits: formattedData,
  })
}