import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Only the columns we care about, mapped from Excel header → DB column
const COLUMN_MAP = {
  'Student No':                                        'student_no',
  'English Name':                                      'english_name',
  'Tawjihi/Equivalency Average':                       'tawjihi_average',
  'Place of Birth':                                    'place_of_birth',
  'Academic Stream':                                   'academic_stream',
  'Governorate Certificate':                           'governorate_certificate',
  'Gender':                                            'gender',
  'School':                                            'school',
  'Date of birth':                                     'date_of_birth',
  'Nationality':                                       'nationality',
  'Degree':                                            'degree',
  'Application Status':                                'application_status',
  'Major':                                             'major',
  'Resident Area':                                     'resident_area',
  'Certificate Nationality':                           'certificate_nationality',
  'School type':                                       'school_type',
  'Would you like to apply for scholarships?':         'wants_scholarship',
  'Seat number':                                       'seat_number',
  'Early Admission Applicant':                         'early_admission',
  'Corresponding College Major':                       'corresponding_college_major',
  'Comprehensive Exam Average':                        'comprehensive_exam_average',
  'Program Period':                                    'program_period',
  'Email':                                             'email',
  'Applicant with disabilities':                       'applicant_with_disabilities',
}

function parseBoolean(val) {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).trim().toUpperCase()
  if (s === 'YES' || s === 'TRUE' || s === '1') return true
  if (s === 'NO' || s === 'FALSE' || s === '0') return false
  return null
}

function parseDate(val) {
  if (!val) return null
  // Excel serial number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (!date) return null
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  // String date
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function parseNumeric(val) {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function parseStudentNo(val) {
  if (val === null || val === undefined || val === '') return null
  const s = String(val).trim()
  return s === '' || s === '0' || s === 'NaN' ? null : s
}

export async function POST(req, { params }) {
  try {
    // 1. Parse the form data FIRST so we can grab the attached year
    const formData = await req.formData()
    const file = formData.get('file')
    
    // Grab the year directly from the form (fallback to params just in case)
    let year = formData.get('year') || (params ? params.year : null)

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!year || year === 'undefined') return NextResponse.json({ error: 'Year is missing' }, { status: 400 })

    // 2. Get cohort
    const { data: cohort, error: cohortError } = await supabase
      .from('previous_year_cohorts')
      .select('id')
      .eq('year', year)
      .single()

    if (cohortError || !cohort) {
      return NextResponse.json({ error: 'Cohort not found for year ' + year }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

    if (!rows.length) return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 })

    // Delete existing students for this cohort before re-import
    await supabase.from('previous_year_students').delete().eq('cohort_id', cohort.id)

    // Map rows to DB records
    const records = rows.map(row => {
      const record = { cohort_id: cohort.id }

      for (const [excelCol, dbCol] of Object.entries(COLUMN_MAP)) {
        const raw = row[excelCol]

        if (dbCol === 'student_no') {
          record[dbCol] = parseStudentNo(raw)
        } else if (dbCol === 'tawjihi_average' || dbCol === 'comprehensive_exam_average') {
          record[dbCol] = parseNumeric(raw)
        } else if (dbCol === 'date_of_birth') {
          record[dbCol] = parseDate(raw)
        } else if (dbCol === 'wants_scholarship' || dbCol === 'early_admission') {
          record[dbCol] = parseBoolean(raw)
        } else if (dbCol === 'seat_number') {
          record[dbCol] = raw !== null && raw !== undefined ? String(raw).trim() : null
        } else {
          record[dbCol] = raw !== null && raw !== undefined && String(raw).trim() !== '' 
            ? String(raw).trim() 
            : null
        }
      }

      return record
    })

    // Bulk insert in batches of 500
    const BATCH = 500
    let inserted = 0
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH)
      const { error: insertError } = await supabase
        .from('previous_year_students')
        .insert(batch)

      if (insertError) {
        return NextResponse.json({ error: insertError.message, batch: Math.floor(i / BATCH) }, { status: 500 })
      }
      inserted += batch.length
    }

    // Update total_imported count on cohort
    await supabase
      .from('previous_year_cohorts')
      .update({ total_imported: inserted })
      .eq('id', cohort.id)

    return NextResponse.json({ success: true, inserted })

  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}