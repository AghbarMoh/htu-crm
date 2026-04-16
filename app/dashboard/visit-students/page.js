'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

export default function VisitStudentsPage() {
  const [students, setStudents] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [filterVisit, setFilterVisit] = useState('all')
  const [importVisitId, setImportVisitId] = useState('')
  const [importing, setImporting] = useState(false)
  const supabase = createClient()

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

  const emptyForm = { visit_id: '', full_name: '', email: '', phone: '', grade: '', nationality: '', major_interested: '', certificate_type: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { 
    fetchStudents(); 
    fetchVisits(); 
  }, [])

  // NEW BULLETPROOF FETCH FUNCTION
  const fetchStudents = async () => {
    setLoading(true)
    
    // 1. Grab all students (No strict joining)
    const { data: studentsData, error: studentError } = await supabase
      .from('visit_students')
      .select('*')
      .order('created_at', { ascending: false })

    // 2. Grab all school visits so we can match the names manually
    const { data: visitsData } = await supabase
      .from('school_visits')
      .select('id, school_name')

    if (!studentError && studentsData) {
      // 3. Connect them together using JavaScript!
      const combinedData = studentsData.map(student => {
        const match = visitsData?.find(v => v.id === student.visit_id)
        return {
          ...student,
          // If it finds the ID, it prints the name. If the ID is missing/deleted, it prints a warning.
          school_visits: { school_name: match ? match.school_name : '⚠️ Unknown / Archived School' }
        }
      })
      setStudents(combinedData)
    } else {
      console.error("Error fetching students:", studentError)
    }
    
    setLoading(false)
  }

  const fetchVisits = async () => {
    // The !inner tag forces Supabase to ONLY return visits that have a completion record
    const { data, error } = await supabase
      .from('school_visits')
      .select('id, school_name, visit_date, visit_completions!inner(visit_id)')
      .order('visit_date', { ascending: false })
      
    if (!error) setVisits(data)
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.visit_id) { alert('Please fill in student name and select a school visit'); return }
    if (editingStudent) {
      const { error } = await supabase.from('visit_students').update(form).eq('id', editingStudent.id)
      if (!error) { fetchStudents(); setShowForm(false); setEditingStudent(null); setForm(emptyForm) }
    } else {
      const { error } = await supabase.from('visit_students').insert([form])
      if (!error) { fetchStudents(); setShowForm(false); setForm(emptyForm) }
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setForm({ visit_id: student.visit_id, full_name: student.full_name, email: student.email || '', phone: student.phone || '', grade: student.grade || '', nationality: student.nationality || '', major_interested: student.major_interested || '', certificate_type: student.certificate_type || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const { error } = await supabase.from('visit_students').delete().eq('id', id)
    if (!error) fetchStudents()
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
      const { error } = await supabase.from('visit_students').insert(students)
      if (!error) { alert('Successfully imported ' + students.length + ' students'); fetchStudents() }
      else alert('Error importing students')
      setImporting(false); e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

  const filteredStudents = filterVisit === 'all' ? students : students.filter(s => s.visit_id === filterVisit)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Visit Students</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Students collected during school visits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select value={importVisitId} onChange={(e) => setImportVisitId(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
            <option value="">Select visit to import into</option>
            {visits.map(v => <option key={v.id} value={v.id}>{v.school_name} — {v.visit_date}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
            <Upload size={14} />
            {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button onClick={() => { setShowForm(true); setEditingStudent(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <select value={filterVisit} onChange={(e) => setFilterVisit(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
          <option value="all">All School Visits</option>
          {visits.map(v => <option key={v.id} value={v.id}>{v.school_name} — {v.visit_date}</option>)}
        </select>
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Full Name', 'School Visit', 'Email', 'Phone', 'Grade', 'Nationality', 'Major Interested', 'Certificate', 'Matched', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No students found</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{student.full_name}</td>
                  {/* Safely print the mapped school name! */}
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

      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>School Visit *</label>
                <select value={form.visit_id} onChange={(e) => setForm({ ...form, visit_id: e.target.value })} style={s.input}>
                  <option value="">Select a visit</option>
                  {visits.map(v => <option key={v.id} value={v.id}>{v.school_name} — {v.visit_date}</option>)}
                </select>
              </div>
              
              <div><label style={s.label}>Full Name *</label><input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Mohammad Aghbar" style={s.input} /></div>
              <div><label style={s.label}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. student@email.com" style={s.input} /></div>
              <div><label style={s.label}>Phone (optional)</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0791234567" style={s.input} /></div>
              <div><label style={s.label}>Nationality</label><input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. Jordanian" style={s.input} /></div>
              
              <div>
                <label style={s.label}>Grade</label>
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={s.input}>
                  <option value="">Select Grade</option>
                  <option value="8th Grade">8th Grade</option>
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Certificate Type</label>
                <input list="cert-options" value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })} placeholder="Select or type..." style={s.input} />
                <datalist id="cert-options">
                  <option value="BTEC اكاديمي/ تكنولوجيا المعلومات" />
                  <option value="BTEC اكاديمي/ مسار الانشاءات و البيئة المبنية" />
                  <option value="BTEC اكاديمي/ مسار هندسي" />
                  <option value="حقل الصحي + مادة الرياضيات" />
                  <option value="حقل العلوم و التكنولوجيا" />
                  <option value="حقل الهندسي" />
                  <option value="حقل مدمج ( الهندسي + العلوم و التكنولوجيا)" />
                  <option value="توجيهي علمي" />
                  <option value="توجيهي صناعي" />
                  <option value="IGCSE" />
                  <option value="IB" />
                  <option value="SAT" />
                </datalist>
              </div>

              <div>
                <label style={s.label}>Major Interested</label>
                <input list="major-options" value={form.major_interested} onChange={(e) => setForm({ ...form, major_interested: e.target.value })} placeholder="Select or type..." style={s.input} />
                <datalist id="major-options">
                  {majors.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>

            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingStudent ? 'Save Changes' : 'Add Student'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingStudent(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}