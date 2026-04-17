import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use the SERVICE ROLE KEY here, NOT the ANON KEY. 
// This bypasses RLS so the server can safely insert the public form submission.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <-- Crucial change
)

export async function POST(req) {
  try {
    const body = await req.json()

    // Server-side validation: Ensure we actually got a visit_id
    if (!body.visit_id) {
      return NextResponse.json({ error: "Missing visit ID" }, { status: 400 })
    }

    // Insert the student data securely
    const { error } = await supabase
      .from('visit_students')
      .insert([{
        visit_id: body.visit_id,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        grade: body.grade || null,
        major_interested: body.major_interested || null,
        certificate_type: body.certificate_type || null, 
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