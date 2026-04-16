import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client for the server
// Ensure you have these environment variables set up
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request) {
  try {
    // 1. Fetch all scheduled visits
    const { data: visits, error: visitsError } = await supabase
      .from('school_visits')
      .select('*')
      .order('visit_date', { ascending: true })

    if (visitsError) throw visitsError

    // 2. Fetch completions to determine which visits are actually "Done"
    const { data: completions, error: completionsError } = await supabase
      .from('visit_completions')
      .select('*')

    if (completionsError) throw completionsError

    // 3. Fetch students to provide exact counts to Dalia
    const { data: students, error: studentsError } = await supabase
      .from('visit_students')
      .select('visit_id')

    if (studentsError) throw studentsError

    // 4. Transform data into an "Agent-Optimized" flat format
    const formattedData = visits.map(visit => {
      const completionRecord = completions.find(c => c.visit_id === visit.id)
      const studentCount = students.filter(s => s.visit_id === visit.id).length

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
        
        // These computed fields are what makes the agent smart:
        status: completionRecord ? 'Completed' : 'Pending',
        accomplishments: completionRecord ? completionRecord.comment : null,
        studentsCollected: studentCount
      }
    })

    // Return the clean payload
    return NextResponse.json({ 
      success: true, 
      totalVisits: formattedData.length,
      visits: formattedData 
    })

  } catch (error) {
    console.error("Agent API Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}