'use client'
import { useState, useEffect } from 'react'
import { Upload, Search, Trash2 } from 'lucide-react'

export default function CompletedApplicantsPage() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterMajor, setFilterMajor] = useState('all')
  const [filterSchoolName, setFilterSchoolName] = useState('all')
  const [filterSchoolType, setFilterSchoolType] = useState('all')
  const [filterMatched, setFilterMatched] = useState('all')

  const majors = ['Energy Engineering', 'Electrical Engineering', 'Game Design and Development', 'Architectural Engineering', 'Cyber Security', 'Computer Science', 'Data Science and Artificial Intelligence', 'Industrial Engineering', 'Mechanical Engineering']

  useEffect(() => { fetchApplicants(); runCrossReference() }, [])

  const fetchApplicants = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applicants/completed')
      const json = await res.json()
      if (json.data) setApplicants(json.data)
    } finally { setLoading(false) }
  }

  const runCrossReference = async () => {
    await fetch('/api/applicants/completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cross_reference_completed', payload: {} })
    })
    fetchApplicants()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    const XLSX = await import('xlsx')
    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      const parsed = rows.map(row => ({
        full_name: row['Student Name'] || row['Student name'] || row['full_name'] || '',
        major: row['Major'] || row['MAJOR'] || row['major'] || '',
        school_name: row['School Name'] || row['school_name'] || '',
        phone: String(row['Phone number'] || row['Phone'] || row['phone'] || ''),
        school_type: row['School type'] || row['School Type'] || row['school_type'] || '',
      })).filter(a => a.full_name)
      if (parsed.length === 0) { alert('No valid applicants found'); setImporting(false); e.target.value = ''; return }
      const res = await fetch('/api/applicants/completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_completed', payload: { rows: parsed, filename: file.name } })
      })
      const json = await res.json()
      if (json.success) {
        alert('Successfully imported ' + parsed.length + ' completed applicants')
        fetchApplicants()
        runCrossReference()
      } else { alert('Import failed: ' + json.error) }
      setImporting(false)
      e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  const uniqueSchoolNames = ['all', ...new Set(applicants.map(a => a.school_name).filter(Boolean))]
  const uniqueSchoolTypes = ['all', ...new Set(applicants.map(a => a.school_type).filter(Boolean))]

  const filtered = applicants.filter(a => {
    const matchSearch = !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.application_no?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
    const matchMajor = filterMajor === 'all' || a.major === filterMajor
    const matchSchoolName = filterSchoolName === 'all' || a.school_name === filterSchoolName
    const matchSchoolType = filterSchoolType === 'all' || a.school_type === filterSchoolType
    const matchMatched = filterMatched === 'all' || (filterMatched === 'matched' ? a.is_matched : !a.is_matched)
    return matchSearch && matchMajor && matchSchoolName && matchSchoolType && matchMatched
  })

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Completed Applicants</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{filtered.length} applicant{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1 }}>
            <Upload size={16} /> {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
          <button
            onClick={async () => {
              if (!confirm('Delete ALL completed applicants? This cannot be undone.')) return
              const res = await fetch('/api/applicants/completed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_all_completed', payload: { count: applicants.length } })
              })
              const json = await res.json()
              if (json.success) { fetchApplicants() } else { alert('Delete failed: ' + json.error) }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ef4444', cursor: 'pointer' }}
          >
            <Trash2 size={16} /> Delete All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or application no..." style={{ ...s.input, paddingLeft: '34px' }} />
        </div>
        <select value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} style={{ ...s.input, width: 'auto', minWidth: '160px' }}>
          <option value="all" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>All Majors</option>
          {majors.map(m => <option key={m} value={m} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{m}</option>)}
        </select>
        <select value={filterSchoolName} onChange={(e) => setFilterSchoolName(e.target.value)} style={{ ...s.input, width: 'auto', minWidth: '160px' }}>
          {uniqueSchoolNames.map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{s === 'all' ? 'All Schools' : s}</option>)}
        </select>
        <select value={filterSchoolType} onChange={(e) => setFilterSchoolType(e.target.value)} style={{ ...s.input, width: 'auto', minWidth: '160px' }}>
          {uniqueSchoolTypes.map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{s === 'all' ? 'All School Types' : s}</option>)}
        </select>
        <select value={filterMatched} onChange={(e) => setFilterMatched(e.target.value)} style={{ ...s.input, width: 'auto', minWidth: '140px' }}>
          <option value="all" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>All</option>
          <option value="matched" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>✓ Matched</option>
          <option value="unmatched" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>No Match</option>
        </select>
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['#', 'Student Name', 'Major', 'School Name', 'Phone Number', 'School Type'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No completed applicants yet</td></tr>
            ) : filtered.map((a, i) => (
              <tr key={a.id} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{a.full_name}</td>
                <td style={s.td}>{a.major ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{a.major}</span> : '-'}</td>
                <td style={s.td}>{a.school_name || '-'}</td>
                <td style={s.td}>{a.phone || '-'}</td>
                <td style={s.td}>{a.school_type || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}