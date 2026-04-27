'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, ChevronLeft, ChevronRight, GraduationCap, BarChart2, SlidersHorizontal, X } from 'lucide-react'

const GENDER_COLOR  = { Male: '#3b82f6', Female: '#ec4899' }
const DEGREE_COLOR  = { Bachelor: '#3b82f6', Technical: '#f59e0b', Technician: '#10b981', 'Unspecified Degree': 'rgba(255,255,255,0.3)' }
const STATUS_COLOR  = {
  'Accepted': '#10b981',
  'Rejected application': '#ef4444',
  'Aptitude test failed': '#f97316',
  'Rejected after interview': '#ef4444',
  'Abstained before acceptance': 'rgba(255,255,255,0.3)',
  'Abstained after acceptance ': 'rgba(255,255,255,0.3)',
}

const pill = (label, color) => (
  <span style={{
    display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
    background: `${color}18`, border: `1px solid ${color}30`, color,
    whiteSpace: 'nowrap'
  }}>{label}</span>
)

function YearStudentsPage() {
const { years: year } = useParams()
  const router   = useRouter()

  const [cohort,   setCohort]   = useState(null)
  const [students, setStudents] = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [query,    setQuery]    = useState('')          // debounced
  const [showFilters, setShowFilters] = useState(false)
  const [filters,  setFilters]  = useState({ gender: '', degree: '', school_type: '', has_student_no: '', has_disability: '' })

  const LIMIT = 50

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { fetchStudents() }, [page, query, filters])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, search: query })
      const res  = await fetch(`/api/previous-years/${year}?${params}`)
      const data = await res.json()
      setCohort(data.cohort || null)
      setStudents(data.students || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const totalPages = Math.ceil(total / LIMIT)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filtered = students.filter(s => {
    if (filters.gender       && s.gender      !== filters.gender)       return false
    if (filters.degree       && s.degree      !== filters.degree)       return false
    if (filters.school_type  && s.school_type !== filters.school_type)  return false
    
    // Check actual database column: student_no
    const hasStuNo = s.student_no && s.student_no.trim() !== ''
    if (filters.has_student_no === 'yes' && !hasStuNo) return false
    if (filters.has_student_no === 'no'  &&  hasStuNo) return false
    
    // Check actual database column: applicant_with_disabilities
    const hasDisability = s.applicant_with_disabilities && String(s.applicant_with_disabilities).toUpperCase() === 'YES'
    if (filters.has_disability === 'yes' && !hasDisability) return false
    if (filters.has_disability === 'no'  &&  hasDisability) return false
    
    return true
  })

  const clearFilters = () => setFilters({ gender: '', degree: '', school_type: '', has_student_no: '', has_disability: '' })

  const FilterChip = ({ label, field, value, color }) => {
    const active = filters[field] === value
    return (
      <button
        onClick={() => setFilters(f => ({ ...f, [field]: active ? '' : value }))}
        style={{
          padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit', border: '1px solid',
          borderColor: active ? (color || 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.1)',
          background: active ? `${color || 'rgba(255,255,255,0.4)'}22` : 'transparent',
          color: active ? (color || '#fff') : 'rgba(255,255,255,0.35)',
          transition: 'all 0.15s'
        }}
      >{label}</button>
    )
  }

  return (
    <div style={{ color: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => router.push('/dashboard/applicants/previous-years')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0
            }}
          ><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 3px 0', letterSpacing: '-0.5px' }}>
              {cohort?.label || `${year} Cohort`}
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {total.toLocaleString()} students · Page {page} of {totalPages || 1}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/analytics/previous-years?year=${year}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
            fontWeight: '600', color: '#8b5cf6', cursor: 'pointer'
          }}
        >
          <BarChart2 size={15} /> View Analytics
        </button>
      </div>

      {/* ── Search + Filter bar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, major, school, email…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px',
              padding: '10px 14px 10px 36px', fontSize: '13px', color: '#fff',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: showFilters || activeFilterCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showFilters || activeFilterCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: '10px', padding: '10px 16px', fontSize: '13px',
            fontWeight: '600', color: showFilters || activeFilterCount > 0 ? '#f59e0b' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: '#f59e0b', color: '#000', borderRadius: '20px', padding: '1px 7px', fontSize: '10px', fontWeight: '700' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px', padding: '16px 20px', marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>

            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Gender</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <FilterChip label="Male"   field="gender" value="Male"   color="#3b82f6" />
                <FilterChip label="Female" field="gender" value="Female" color="#ec4899" />
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Degree</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <FilterChip label="Bachelor"   field="degree" value="Bachelor"   color="#3b82f6" />
                <FilterChip label="Technical"  field="degree" value="Technical"  color="#f59e0b" />
                <FilterChip label="Technician" field="degree" value="Technician" color="#10b981" />
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>School Type</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <FilterChip label="Private"      field="school_type" value="private"      color="#8b5cf6" />
                <FilterChip label="Governmental" field="school_type" value="governmental" color="#06b6d4" />
                <FilterChip label="Other"        field="school_type" value="Other"        color="rgba(255,255,255,0.5)" />
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Student No</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <FilterChip label="Has No"    field="has_student_no" value="yes" color="#10b981" />
                <FilterChip label="No Number" field="has_student_no" value="no"  color="#f97316" />
              </div>
            </div>

            <div>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>Disability</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <FilterChip label="Has Disability" field="has_disability" value="yes" color="#f59e0b" />
                <FilterChip label="None"           field="has_disability" value="no"  color="rgba(255,255,255,0.5)" />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                    fontWeight: '600', color: '#f87171', cursor: 'pointer'
                  }}
                ><X size={11} /> Clear all</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        {/* Table head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr',
          padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          {['Name', 'Major', 'Degree', 'Gender', 'School', 'Stream', 'Tawjihi', 'Stu. No', 'Disability'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
            Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
            No students match your search or filters.
          </div>
        ) : (
          filtered.map((s, i) => {
            const gColor  = GENDER_COLOR[s.gender]   || 'rgba(255,255,255,0.3)'
            const dColor  = DEGREE_COLOR[s.degree]   || 'rgba(255,255,255,0.3)'
            const stColor = STATUS_COLOR[s.application_status] || 'rgba(255,255,255,0.3)'
            return (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr',
                  padding: '11px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                  alignItems: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Name */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', margin: '0 0 1px 0', color: '#fff' }}>
                    {s.english_name || '—'}
                  </p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                    {s.governorate_certificate || s.resident_area || '—'}
                  </p>
                </div>

                {/* Major */}
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', paddingRight: '8px' }} title={s.major}>
                  {s.major ? (s.major.length > 22 ? s.major.slice(0, 22) + '…' : s.major) : '—'}
                </span>

                {/* Degree */}
                {s.degree ? pill(s.degree === 'Unspecified Degree' ? 'Unspec.' : s.degree, dColor) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>}

                {/* Gender */}
                {s.gender ? pill(s.gender, gColor) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>}

                {/* School */}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', paddingRight: '8px' }} title={s.school}>
                  {s.school ? (s.school.length > 24 ? s.school.slice(0, 24) + '…' : s.school) : '—'}
                </span>

                {/* Stream */}
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} title={s.academic_stream}>
                  {s.academic_stream ? (s.academic_stream.length > 12 ? s.academic_stream.slice(0, 12) + '…' : s.academic_stream) : '—'}
                </span>

                {/* Tawjihi */}
                <span style={{
                  fontSize: '13px', fontWeight: '700',
                  color: s.tawjihi_average >= 90 ? '#10b981' : s.tawjihi_average >= 80 ? '#3b82f6' : s.tawjihi_average >= 70 ? '#f59e0b' : 'rgba(255,255,255,0.3)'
                }}>
                  {s.tawjihi_average ?? '—'}
                </span>

                {/* Has Student No */}
                <span style={{ fontSize: '18px' }} title={s.student_no ? 'Has student number' : 'No student number'}>
                  {s.student_no ? '✓' : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                </span>

                {/* Disability */}
                <span style={{ fontSize: '11px', color: (s.applicant_with_disabilities && String(s.applicant_with_disabilities).toUpperCase() === 'YES') ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
                  {(s.applicant_with_disabilities && String(s.applicant_with_disabilities).toUpperCase() === 'YES') ? 'Yes' : 'No'}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} students
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'
              }}
            ><ChevronLeft size={14} /></button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    background: p === page ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${p === page ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: p === page ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >{p}</button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'
              }}
            ><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(59,130,246,0.35) !important; }
      `}</style>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.3)', padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <YearStudentsPage />
    </Suspense>
  )
}