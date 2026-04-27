import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('completed_applicants')
    .select('*')
    .order('imported_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'import_completed') {
    const { rows, filename } = payload
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'No valid applicants' }, { status: 400 })
    const validRows = rows.filter(r => r.full_name && r.full_name.trim() !== '')
    if (validRows.length === 0) return NextResponse.json({ error: 'No valid applicants with names' }, { status: 400 })
    const { error } = await supabase.from('completed_applicants').insert(validRows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Imported completed applicants', 'applicant', filename, `Imported ${rows.length} completed applicants from Excel`)
    return NextResponse.json({ success: true, count: rows.length })
  }

  if (action === 'delete_all_completed') {
    const { count } = payload
    await supabase.from('visit_students').update({ is_completed_matched: false, matched_completed_applicant_id: null }).not('matched_completed_applicant_id', 'is', null)
    await supabase.from('completed_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('completed_applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted all completed applicants', 'applicant', 'All', `Deleted ${count} completed applicants`)
    return NextResponse.json({ success: true })
  }

  if (action === 'cross_reference_completed') {
    const { data: visitStudents } = await supabase
      .from('visit_students')
      .select('id, full_name, phone, email, is_completed_matched')
    const { data: completedApplicants } = await supabase
      .from('completed_applicants')
      .select('id, full_name, phone, email')
    if (!visitStudents || !completedApplicants) return NextResponse.json({ success: true })

    const normalizePhone = (p) => p?.replace(/\D/g, '').replace(/^962/, '0').replace(/^00962/, '0')

    for (const vs of visitStudents) {
      let matchedOn = null
      const match = completedApplicants.find(a => {
        const reasons = []

        const isPhoneMatch = a.phone && vs.phone && normalizePhone(a.phone) === normalizePhone(vs.phone)
        if (isPhoneMatch) reasons.push('phone')

        const isEmailMatch = a.email && vs.email && a.email.toLowerCase() === vs.email.toLowerCase()
        if (isEmailMatch) reasons.push('email')

        const appWords = a.full_name?.toLowerCase().split(/\s+/).filter(Boolean) || []
        const visitWords = vs.full_name?.toLowerCase().split(/\s+/).filter(Boolean) || []
        const shorter = appWords.length <= visitWords.length ? appWords : visitWords
        const longer = appWords.length <= visitWords.length ? visitWords : appWords
        const isNameMatch = shorter.length > 1 && shorter.every(word => longer.includes(word))
        if (isNameMatch) reasons.push('name')

        if (reasons.length > 0) { matchedOn = reasons.join(', '); return true }
        return false
      })

      if (match && matchedOn) {
        await supabase.from('completed_applicants').update({
          is_matched: true,
          matched_visit_student_id: vs.id
        }).eq('id', match.id)

        await supabase.from('visit_students').update({
          is_completed_matched: true,
          matched_completed_applicant_id: match.id
        }).eq('id', vs.id)

        await supabase.from('completed_matches').upsert({
          visit_student_id: vs.id,
          completed_applicant_id: match.id,
          completed_applicant_name: match.full_name,
          completed_applicant_email: match.email,
          completed_applicant_phone: match.phone,
          matched_on: matchedOn
        }, { onConflict: 'visit_student_id' })
      }
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}