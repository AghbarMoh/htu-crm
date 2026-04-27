// app/api/applicants/route.js
// Handles all applicants, matches, and cross-reference operations.
// Replaces all direct supabase calls from app/dashboard/applicants/page.js

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

// GET /api/applicants
export async function GET(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('applicants')
    .select('*')
    .order('imported_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/applicants
// action: 'insert' | 'update' | 'delete' | 'status' | 'import' | 'cross_reference'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { error } = await supabase.from('applicants').insert([payload])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Added applicant', 'applicant', payload.full_name, 'New applicant added manually')
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('applicants').update(rest).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited applicant', 'applicant', rest.full_name, 'Updated applicant details')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, full_name } = payload
    const { error } = await supabase.from('applicants').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted applicant', 'applicant', full_name, 'Applicant removed')
    return NextResponse.json({ success: true })
  }

  if (action === 'status') {
    const { id, status, full_name } = payload
    const { error } = await supabase.from('applicants').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Changed status', 'applicant', full_name, 'Status changed to ' + status)
    return NextResponse.json({ success: true })
  }

  if (action === 'import') {
    // payload.rows = array of applicant objects already parsed client-side from Excel
    const { rows, filename } = payload
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'No valid applicants' }, { status: 400 })
    // Validate each row has required fields
    const validRows = rows.filter(r => r.full_name && r.full_name.trim() !== '')
    if (validRows.length === 0) return NextResponse.json({ error: 'No valid applicants with names' }, { status: 400 })
    const { error } = await supabase.from('applicants').insert(validRows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Imported applicants', 'applicant', filename, `Imported ${rows.length} applicants from Excel`)
    return NextResponse.json({ success: true, count: rows.length })
  }

  if (action === 'delete_all') {
    const { count } = payload
    const { error } = await supabase.from('applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted all applicants', 'applicant', 'All', `Deleted ${count} pending applicants`)
    return NextResponse.json({ success: true })
  }



  if (action === 'cross_reference') {
    // ONLY matches pending applicants (applicants table) with visit students
    // Completed applicants are completely ignored here
    const { data: visitStudents } = await supabase
      .from('visit_students')
      .select('id, full_name, phone, email, is_completed_matched')
    const { data: currentApplicants } = await supabase
      .from('applicants')
      .select('id, full_name, phone, email')

    if (!visitStudents || !currentApplicants) return NextResponse.json({ success: true })

    for (const vs of visitStudents) {
      // Skip if already matched to a completed applicant (completed takes precedence)
      if (vs.is_completed_matched) continue
      
      let matchedOn = null
      const match = currentApplicants.find(a => {
        const normalizePhone = (p) => p?.replace(/\D/g, '').replace(/^962/, '0').replace(/^00962/, '0')
        
        const isPhoneMatch = a.phone && vs.phone && normalizePhone(a.phone) === normalizePhone(vs.phone)
        if (isPhoneMatch) { matchedOn = 'phone'; return true }
        
        const isEmailMatch = a.email && vs.email && a.email.toLowerCase() === vs.email.toLowerCase()
        if (isEmailMatch) { matchedOn = 'email'; return true }

        const appWords = a.full_name?.toLowerCase().split(/\s+/).filter(Boolean) || []
        const visitWords = vs.full_name?.toLowerCase().split(/\s+/).filter(Boolean) || []
        const shorter = appWords.length <= visitWords.length ? appWords : visitWords
        const longer = appWords.length <= visitWords.length ? visitWords : appWords
        const isNameMatch = shorter.length > 1 && shorter.every(word => longer.includes(word))
        if (isNameMatch) { matchedOn = 'name'; return true }
        
        return false
      })

      if (match && matchedOn) {
        await supabase.from('matches').upsert(
          { 
            visit_student_id: vs.id, 
            applicant_name: match.full_name, 
            applicant_email: match.email, 
            applicant_phone: match.phone,
            matched_on: matchedOn
          },
          { onConflict: 'visit_student_id' }
        )
        // Only update PENDING-specific flags on visit_students
        await supabase.from('visit_students').update({ 
          is_matched: true, 
          matched_applicant_id: match.id 
        }).eq('id', vs.id)
        await supabase.from('applicants').update({ 
          is_matched: true, 
          matched_visit_student_id: vs.id 
        }).eq('id', match.id)
      }
    }

    // Sync saved matches back to applicants (safety net for re-imports)
    const { data: savedMatches } = await supabase.from('matches').select('*')
    if (savedMatches) {
      for (const m of savedMatches) {
        const applicant = currentApplicants.find(a => {
          const cleanAppName = a.full_name?.toLowerCase().replace(/\s+/g, '')
          const cleanMatchName = m.applicant_name?.toLowerCase().replace(/\s+/g, '')
          const isNameMatch = cleanAppName && cleanMatchName && cleanAppName === cleanMatchName
          const isEmailMatch = a.email && m.applicant_email && a.email.toLowerCase() === m.applicant_email.toLowerCase()
          const isPhoneMatch = a.phone && m.applicant_phone && a.phone === m.applicant_phone
          return isNameMatch || isEmailMatch || isPhoneMatch
        })
        if (applicant) {
          await supabase.from('applicants').update({ 
            is_matched: true, 
            matched_visit_student_id: m.visit_student_id 
          }).eq('id', applicant.id)
        }
      }
    }

    return NextResponse.json({ success: true })
  }



  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}