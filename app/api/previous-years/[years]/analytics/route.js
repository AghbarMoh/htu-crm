import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key] || 'Unknown'
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})
}

function toSorted(obj, limit = null) {
  const arr = Object.entries(obj)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  return limit ? arr.slice(0, limit) : arr
}

export async function GET(req, { params }) {
  const { years } = await params
  const year = years

  const { data: cohort, error: cohortError } = await supabase
    .from('previous_year_cohorts')
    .select('id, label, year, total_imported')
    .eq('year', year)
    .single()

  if (cohortError || !cohort) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

let students = []
  let from = 0
  const batchSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('previous_year_students')
      .select('*')
      .eq('cohort_id', cohort.id)
      .range(from, from + batchSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break

    students.push(...data)
    if (data.length < batchSize) break
    from += batchSize
  }
  console.log('Total students fetched:', students.length)
  const total = students.length
  if (total === 0) return NextResponse.json({ cohort, total: 0, empty: true })

  // ── Gender ──
  const genderCounts = groupBy(students, 'gender')
  const male = genderCounts['Male'] || 0
  const female = genderCounts['Female'] || 0

  // ── Degree ──
  const degreeCounts = groupBy(students, 'degree')

  // ── Major ──
  const majorCounts = groupBy(students, 'major')

  // ── Degree × Major × Gender (for sunburst/treemap) ──
  const degreeMap = {}
  students.forEach(s => {
    const deg = s.degree || 'Unknown'
    const maj = s.major || 'Unknown'
    const gen = s.gender || 'Unknown'
    if (!degreeMap[deg]) degreeMap[deg] = {}
    if (!degreeMap[deg][maj]) degreeMap[deg][maj] = { Male: 0, Female: 0, Unknown: 0 }
    degreeMap[deg][maj][gen] = (degreeMap[deg][maj][gen] || 0) + 1
  })

  const degreeTree = Object.entries(degreeMap).map(([degree, majors]) => ({
    name: degree,
    count: Object.values(majors).reduce((s, g) => s + g.Male + g.Female + (g.Unknown || 0), 0),
    children: Object.entries(majors).map(([major, genders]) => ({
      name: major,
      count: genders.Male + genders.Female + (genders.Unknown || 0),
      male: genders.Male,
      female: genders.Female,
    }))
  }))

  // ── Major × Gender (for the key chart) ──
  const majorGender = {}
  students.forEach(s => {
    const maj = s.major || 'Unknown'
    if (!majorGender[maj]) majorGender[maj] = { major: maj, Male: 0, Female: 0 }
    if (s.gender === 'Male') majorGender[maj].Male++
    else if (s.gender === 'Female') majorGender[maj].Female++
  })
  const majorGenderData = Object.values(majorGender)
    .map(m => ({ ...m, total: m.Male + m.Female }))
    .sort((a, b) => b.total - a.total)

  // ── Tawjihi Grade Distribution ──
  const gradeRanges = {
    '70–75': 0, '75–80': 0, '80–85': 0,
    '85–90': 0, '90–95': 0, '95–100': 0
  }
  const gradeMale = { ...gradeRanges }
  const gradeFemale = { ...gradeRanges }

  students.forEach(s => {
    const g = parseFloat(s.tawjihi_average)
    if (isNaN(g)) return
    let bucket
    if (g < 75) bucket = '70–75'
    else if (g < 80) bucket = '75–80'
    else if (g < 85) bucket = '80–85'
    else if (g < 90) bucket = '85–90'
    else if (g < 95) bucket = '90–95'
    else bucket = '95–100'
    if (s.gender === 'Male') gradeMale[bucket]++
    else if (s.gender === 'Female') gradeFemale[bucket]++
  })

  const gradeDistribution = Object.keys(gradeRanges).map(range => ({
    range,
    Male: gradeMale[range],
    Female: gradeFemale[range],
    total: gradeMale[range] + gradeFemale[range]
  }))

  // ── Academic Stream ──
  const streamCounts = groupBy(students, 'academic_stream')

  // ── School Type ──
  const schoolTypeCounts = groupBy(students, 'school_type')

  // ── Top Schools ──
  const schoolCounts = groupBy(students, 'school')
  const topSchools = toSorted(schoolCounts, 15)

  // ── Governorate / Residence ──
  const governorateCounts = groupBy(students, 'governorate_certificate')
  const governorateData = toSorted(governorateCounts)

  const residentAreaCounts = groupBy(students, 'resident_area')
  const residentAreaData = toSorted(residentAreaCounts)

  // ── Nationality ──
  const nationalityCounts = groupBy(students, 'nationality')
  const nationalityData = toSorted(nationalityCounts)

  // ── Has Student No ──
  // Check if the student_no column actually has a value
  const hasStudentNo = students.filter(s => s.student_no && s.student_no.trim() !== '').length
  const noStudentNo = total - hasStudentNo

  // ── Has Disability ──
  // Check the actual column name and verify if it equals "YES"
  const hasDisability = students.filter(s => s.applicant_with_disabilities && String(s.applicant_with_disabilities).toUpperCase() === 'YES').length
  const noDisability = total - hasDisability

  // ── Application Status ──
  const statusCounts = groupBy(students, 'application_status')
  const statusData = toSorted(statusCounts)
// ── Enrollment Funnel by Major ──
  const funnelMap = {}
  students.forEach(s => {
    const maj = s.major || 'Unknown'
    if (!funnelMap[maj]) funnelMap[maj] = { major: maj, total: 0, accepted: 0, enrolled: 0 }
    funnelMap[maj].total++
    const status = (s.application_status || '').toLowerCase()
    if (status.includes('accept') || status.includes('abstain')) funnelMap[maj].accepted++
    if (s.student_no && s.student_no.trim() !== '') funnelMap[maj].enrolled++
  })
  const enrollmentFunnel = Object.values(funnelMap)
    .map(m => ({
      ...m,
      acceptRate:   m.total   ? Math.round(m.accepted / m.total   * 100) : 0,
      enrollRate:   m.total   ? Math.round(m.enrolled / m.total   * 100) : 0,
      convRate:     m.accepted ? Math.round(m.enrolled / m.accepted * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 14)

  // ── Major DNA — enrolled students only (has student_no) ──
  const enrolledDnaMap = {}
  students.filter(s => s.student_no && s.student_no.trim() !== '').forEach(s => {
    const maj = s.major || 'Unknown'
    if (!enrolledDnaMap[maj]) enrolledDnaMap[maj] = {
      major: maj, total: 0,
      male: 0, female: 0,
      tawjihiSum: 0, tawjihiCount: 0,
      private: 0, governmental: 0,
      governorates: {}
    }
    const d = enrolledDnaMap[maj]
    d.total++
    if (s.gender === 'Male') d.male++
    else if (s.gender === 'Female') d.female++
    const g = parseFloat(s.tawjihi_average)
    if (!isNaN(g)) { d.tawjihiSum += g; d.tawjihiCount++ }
    const st = (s.school_type || '').toLowerCase()
    if (st === 'private') d.private++
    else if (st === 'governmental') d.governmental++
    const gov = s.governorate_certificate || 'Unknown'
    d.governorates[gov] = (d.governorates[gov] || 0) + 1
  })

  const majorDNA = Object.values(enrolledDnaMap)
    .filter(m => m.total >= 5)
    .map(m => ({
      major: m.major,
      total: m.total,
      genderRatio:  m.total ? Math.round(m.male / m.total * 100) : 50,
      avgTawjihi:   m.tawjihiCount ? Math.round((m.tawjihiSum / m.tawjihiCount) * 10) / 10 : 0,
      privateRatio: m.total ? Math.round(m.private / m.total * 100) : 0,
      enrollRate:   0,
      topGov:       Object.entries(m.governorates).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown',
      topGovPct:    m.total ? Math.round((Object.entries(m.governorates).sort((a,b) => b[1]-a[1])[0]?.[1] || 0) / m.total * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 16)
  // ── Tawjihi avg by major (top 10) ──
  const majorAvgMap = {}
  students.forEach(s => {
    const maj = s.major || 'Unknown'
    const g = parseFloat(s.tawjihi_average)
    if (isNaN(g)) return
    if (!majorAvgMap[maj]) majorAvgMap[maj] = { sum: 0, count: 0 }
    majorAvgMap[maj].sum += g
    majorAvgMap[maj].count++
  })
  const majorAvgData = Object.entries(majorAvgMap)
    .map(([major, { sum, count }]) => ({ major, avg: Math.round((sum / count) * 100) / 100, count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 12)

  return NextResponse.json({
    cohort,
    total,
    // KPIs
    male,
    female,
    hasStudentNo,
    noStudentNo,
    hasDisability,
    noDisability,
    // Charts
    degreeCounts: toSorted(degreeCounts),
    majorCounts: toSorted(majorCounts),
    degreeTree,
    majorGenderData,
    gradeDistribution,
    streamCounts: toSorted(streamCounts),
    schoolTypeCounts: toSorted(schoolTypeCounts),
    topSchools,
    governorateData,
    residentAreaData,
    nationalityData,
    statusData,
    majorAvgData,
    enrollmentFunnel,
    majorDNA,
  })
}