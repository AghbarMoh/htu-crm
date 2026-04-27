import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    if (!body.visit_id) {
      return NextResponse.json({ error: "Missing visit ID" }, { status: 400 })
    }

    const isSchool = body.mode === 'school'
    const table = isSchool ? 'visit_students' : 'outreach_students'

    const { error } = await supabase
      .from(table)
      .insert([{
        visit_id: body.visit_id,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        grade: body.grade || null,
        major_interested: body.major_interested || null,
        certificate_type: body.certificate_type || null,
        nationality: body.nationality || null,
        residence_place: body.residence_place || null,
        is_matched: false
      }])

    if (error) {
      console.error("Supabase Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Submission pipeline error:", error)
    return NextResponse.json({ error: "Failed to process student submission" }, { status: 500 })
  }
}