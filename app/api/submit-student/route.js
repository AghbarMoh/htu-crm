import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    // Insert the student data into your table, now including the certificate type
    const { data, error } = await supabase
      .from('visit_students')
      .insert([{
        visit_id: body.visit_id,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        grade: body.grade || null,
        major_interested: body.major_interested || null,
        certificate_type: body.certificate_type || null, // NEW FIELD ADDED
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