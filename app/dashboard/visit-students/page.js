'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

export default function VisitStudentsPage() {
  const [students, setStudents] = useState([])
  const [visits, setVisits] = useState([])
  const [completions, setCompletions] = useState({}) // Add this state
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [filterVisit, setFilterVisit] = useState('all')
  const [importVisitId, setImportVisitId] = useState('')
  const [importing, setImporting] = useState(false)
  const [outreachVisitsList, setOutreachVisitsList] = useState([])
  

  const majors = [
    'Mechanical Engineering', 
    'Game Design and Development', 
    'Computer Science', 
    'Cyber Security', 
    'Electrical Engineering', 
    'Data Science and Artificial Intelligence', 
    'Energy Engineering', 
    'Architectural Engineering', 
    'Industrial Engineering'
  ]

  const emptyForm = { visit_id: '', full_name: '', email: '', phone: '', grade: '', nationality: '', major_interested: '', certificate_type: '', residence_place: '' }
  const [form, setForm] = useState(emptyForm)
  const [addType, setAddType] = useState(null) // null | 'school' | 'outreach'

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/visit-students')
      const json = await res.json()

      if (json.visits) setVisits(json.visits)
      if (json.outreachVisits) setOutreachVisitsList(json.outreachVisits)
      
      // Store completions in a map for easy lookup
      if (json.completions) {
        const map = {}
        json.completions.forEach(c => { map[c.visit_id] = c })
        setCompletions(map)
      }

      let allStudents = []

      if (json.students && json.visits) {
        const schoolData = json.students.map(student => {
          const match = json.visits.find(v => v.id === student.visit_id)
          return {
            ...student,
            source: 'school',
            visit_name: match ? match.school_name : '⚠️ Unknown / Archived School',
            visit_date: match ? match.visit_date : '',
            school_visits: { school_name: match ? match.school_name : '⚠️ Unknown / Archived School' }
          }
        })
        allStudents = [...allStudents, ...schoolData]
      }

      if (json.outreachStudents && json.outreachVisits) {
        const outreachData = json.outreachStudents.map(student => {
          const match = json.outreachVisits.find(v => v.id === student.visit_id)
          return {
            ...student,
            source: 'outreach',
            visit_name: match ? match.name : '⚠️ Unknown / Archived Visit',
            visit_date: match ? match.date_from : '',
            school_visits: { school_name: match ? `${match.name} (Outreach)` : '⚠️ Unknown Outreach' }
          }
        })
        allStudents = [...allStudents, ...outreachData]
      }

      allStudents.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      setStudents(allStudents)
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchAllData() 
  }, [])

  const handleSubmit = async () => {
    if (!form.full_name) { alert('Please fill in student name'); return }
    if (!editingStudent && !form.visit_id) { alert('Please select a visit'); return }

    const action = editingStudent ? 'update' : 'insert'
    const source = editingStudent ? editingStudent.source : addType
    const payload = editingStudent ? { ...form, id: editingStudent.id } : form

    await fetch('/api/visit-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, source })
    })

    fetchAllData()
    setShowForm(false)
    setEditingStudent(null)
    setAddType(null)
    setForm(emptyForm)
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setForm({ visit_id: student.visit_id, full_name: student.full_name, email: student.email || '', phone: student.phone || '', grade: student.grade || '', nationality: student.nationality || '', major_interested: student.major_interested || '', certificate_type: student.certificate_type || '', residence_place: student.residence_place || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const student = students.find(s => s.id === id)
    
    await fetch('/api/visit-students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id, full_name: student?.full_name }, source: student?.source })
    })
    fetchAllData()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!importVisitId) { alert('Please select a school visit before importing'); e.target.value = ''; return }
    setImporting(true)
    const XLSX = await import('xlsx')
    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      const students = rows.map(row => ({
        visit_id: importVisitId,
        full_name: row['Full Name'] || row['full_name'] || '',
        email: row['Email'] || row['email'] || '',
        phone: row['Phone'] || row['phone'] || '',
        grade: row['Grade'] || row['grade'] || '',
        nationality: row['Nationality'] || row['nationality'] || '',
        major_interested: row['Major Interested'] || row['major_interested'] || '',
        certificate_type: row['Certificate Type'] || row['certificate_type'] || '',
      })).filter(s => s.full_name)
      if (students.length === 0) { alert('No valid students found'); setImporting(false); e.target.value = ''; return }
      
      const res = await fetch('/api/visit-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', payload: students })
      })
      const json = await res.json()

      if (json.success) { 
        alert('Successfully imported ' + students.length + ' students')
        fetchAllData() 
      } else {
        alert('Error importing students: ' + json.error)
      }
      setImporting(false); e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  const schoolStudents = (filterVisit === 'all' ? students : students.filter(s => s.visit_id === filterVisit)).filter(s => s.source === 'school' || !s.source)
  const outreachStudents = students.filter(s => s.source === 'outreach')
  
  // Create a list of only completed visits for our dropdowns
  // Now we check if the visit ID exists in our completions map
  const completedVisits = visits.filter(v => completions[v.id])

  // This ensures the student's current school shows up in the Edit box 
  // even if it isn't "Completed" yet.
  const modalDropdownVisits = editingStudent 
    ? visits.filter(v => completions[v.id] || v.id === editingStudent.visit_id)
    : completedVisits

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
input: { width: '100%', backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Leads</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Students collected during school visits & outreach events</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select value={importVisitId} onChange={(e) => setImportVisitId(e.target.value)} style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
  <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select visit to import into</option>
  {completedVisits.map(v => (
    <option key={v.id} value={v.id} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
      {v.school_name} — {v.visit_date}
    </option>
  ))}
</select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
            <Upload size={14} />
            {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button onClick={() => { setShowForm(true); setEditingStudent(null); setAddType(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <select value={form.visit_id} onChange={(e) => setForm({ ...form, visit_id: e.target.value })} style={s.input}>
  <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select a visit</option>
  {completedVisits.map(v => (
    <option key={v.id} value={v.id} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
      {v.school_name} — {v.visit_date}
    </option>
  ))}
</select>
      </div>

      {/* School Visit Leads */}
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#60a5fa', marginBottom: '12px' }}>School Visit Leads</h2>
      <div style={{ ...s.card, marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Full Name', 'School Visit', 'Email', 'Phone', 'Grade', 'Nationality', 'Major Interested', 'Certificate', 'Matched', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : schoolStudents.length === 0 ? (
              <tr><td colSpan={11} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No school visit students found</td></tr>
            ) : (
              schoolStudents.map((student, i) => (
                <tr key={student.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{student.full_name}</td>
                  <td style={s.td}>{student.school_visits?.school_name}</td>
                  <td style={s.td}>{student.email || '-'}</td>
                  <td style={s.td}>{student.phone || '-'}</td>
                  <td style={s.td}>{student.grade || '-'}</td>
                  <td style={s.td}>{student.nationality || '-'}</td>
                  <td style={s.td}>{student.major_interested || '-'}</td>
                  <td style={s.td}>{student.certificate_type || '-'}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      background: student.is_matched ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      color: student.is_matched ? '#10b981' : 'rgba(255,255,255,0.3)',
                    }}>
                      {student.is_matched ? '✓ Matched' : 'No match'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(student)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(student.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Outreach Leads */}
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#818cf8', marginBottom: '12px' }}>Outreach Leads</h2>
      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Full Name', 'Outreach Event', 'Email', 'Phone', 'Grade', 'Nationality', 'Major Interested', 'Certificate', 'Residence', 'Matched', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : outreachStudents.length === 0 ? (
              <tr><td colSpan={12} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No outreach students found</td></tr>
            ) : (
              outreachStudents.map((student, i) => (
                <tr key={student.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{student.full_name}</td>
                  <td style={s.td}>{student.school_visits?.school_name}</td>
                  <td style={s.td}>{student.email || '-'}</td>
                  <td style={s.td}>{student.phone || '-'}</td>
                  <td style={s.td}>{student.grade || '-'}</td>
                  <td style={s.td}>{student.nationality || '-'}</td>
                  <td style={s.td}>{student.major_interested || '-'}</td>
                  <td style={s.td}>{student.certificate_type || '-'}</td>
                  <td style={s.td}>{student.residence_place || '-'}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      background: student.is_matched ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      color: student.is_matched ? '#10b981' : 'rgba(255,255,255,0.3)',
                    }}>
                      {student.is_matched ? '✓ Matched' : 'No match'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(student)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(student.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>

            {/* Step 1 — type picker (only for new students) */}
            {!editingStudent && !addType ? (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>Add New Student</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px 0' }}>Where is this student from?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => setAddType('school')} style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', color: '#60a5fa', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                    🏫 School Visit Lead
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0 0', fontWeight: '400' }}>Student collected during a school visit</p>
                  </button>
                  <button onClick={() => setAddType('outreach')} style={{ padding: '16px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '12px', color: '#818cf8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                    🌍 Outreach Lead
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0 0', fontWeight: '400' }}>Student collected during an outreach event</p>
                  </button>
                </div>
                <button onClick={() => { setShowForm(false); setForm(emptyForm) }} style={{ width: '100%', marginTop: '16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
                  {editingStudent ? 'Edit Student' : addType === 'outreach' ? '🌍 Add Outreach Lead' : '🏫 Add School Visit Lead'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Visit selector */}
                  <div>
                    <label style={s.label}>{(editingStudent?.source || addType) === 'outreach' ? 'Outreach Event *' : 'School Visit *'}</label>
                    <select value={form.visit_id} onChange={(e) => setForm({ ...form, visit_id: e.target.value })} style={s.input}>
                      <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select a visit</option>
                      {(editingStudent?.source || addType) === 'outreach'
                        ? outreachVisitsList.map(v => (
                            <option key={v.id} value={v.id} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{v.name} — {v.date_from}</option>
                          ))
                        : modalDropdownVisits.map(v => (
                            <option key={v.id} value={v.id} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{v.school_name} — {v.visit_date}</option>
                          ))
                      }
                    </select>
                  </div>

                  <div><label style={s.label}>Full Name *</label><input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Mohammad Aghbar" style={s.input} /></div>
                  <div><label style={s.label}>Phone Number</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0791234567" style={s.input} /></div>
                  <div><label style={s.label}>Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. student@email.com" style={s.input} /></div>

                  <div>
                    <label style={s.label}>Current Grade</label>
                    <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={s.input}>
                      <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select your grade</option>
                      {['8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'].map(g => (
                        <option key={g} value={g} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={s.label}>Certificate Type</label>
                    <select value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })} style={s.input}>
                      <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select Certificate</option>
                      {(editingStudent?.source || addType) === 'outreach'
                        ? ['AP','IG','IB','SAT','National','Others'].map(c => (
                            <option key={c} value={c} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{c}</option>
                          ))
                        : [
                            'BTEC اكاديمي/ تكنولوجيا المعلومات',
                            'BTEC اكاديمي/ مسار الانشاءات و البيئة المبنية',
                            'BTEC اكاديمي/ مسار هندسي',
                            'حقل الصحي + مادة الرياضيات',
                            'حقل العلوم و التكنولوجيا',
                            'حقل الهندسي',
                            'حقل مدمج ( الهندسي + العلوم و التكنولوجيا)',
                            'توجيهي علمي',
                            'توجيهي صناعي',
                            'IGCSE','IB','SAT'
                          ].map(c => (
                            <option key={c} value={c} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{c}</option>
                          ))
                      }
                    </select>
                  </div>

                  {/* Outreach-only fields */}
                  {(editingStudent?.source || addType) === 'outreach' && (
                    <>
                      <div><label style={s.label}>Nationality</label><input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. Jordanian" style={s.input} /></div>
                      <div><label style={s.label}>Residence Place</label><input type="text" value={form.residence_place} onChange={(e) => setForm({ ...form, residence_place: e.target.value })} placeholder="e.g. Amman" style={s.input} /></div>
                    </>
                  )}

                  <div>
                    <label style={s.label}>Major Interested In</label>
                    <select value={form.major_interested} onChange={(e) => setForm({ ...form, major_interested: e.target.value })} style={s.input}>
                      <option value="" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Select a major</option>
                      {[...majors, 'Others'].map(m => (
                        <option key={m} value={m} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{m}</option>
                      ))}
                    </select>
                  </div>

                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                    {editingStudent ? 'Save Changes' : 'Add Student'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingStudent(null); setAddType(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}