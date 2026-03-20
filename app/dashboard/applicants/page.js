'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Upload, Search, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingApplicant, setEditingApplicant] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMajor, setFilterMajor] = useState('all')
  const [filterNationality, setFilterNationality] = useState('all')
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveLabel, setArchiveLabel] = useState('')
  const [archiving, setArchiving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const majors = ['Energy Engineering', 'Electrical Engineering', 'Game Design and Development', 'Architectural Engineering', 'Cyber Security', 'Computer Science', 'Data Science and AI', 'Industrial Engineering']

  const emptyForm = { full_name: '', phone: '', email: '', nationality: '', semester: '', year: '', electronic_payment_no: '', application_no: '', application_date: '', payment_date: '', paid: false, heard_about_htu: '', major: '', status: 'red', notes: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchApplicants(); runCrossReference() }, [])

  const fetchApplicants = async () => {
    setLoading(true)
   const { data, error } = await supabase.from('applicants').select('*').eq('is_archived', false).order('imported_at', { ascending: false })
    if (!error) setApplicants(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.full_name) { alert('Please fill in student name'); return }
    if (editingApplicant) {
      const { error } = await supabase.from('applicants').update(form).eq('id', editingApplicant.id)
      if (!error) { fetchApplicants(); setShowForm(false); setEditingApplicant(null); setForm(emptyForm) }
    } else {
      const { error } = await supabase.from('applicants').insert([form])
      if (!error) { fetchApplicants(); setShowForm(false); setForm(emptyForm) }
    }
  }

  const handleEdit = (applicant) => {
    setEditingApplicant(applicant)
    setForm({
      full_name: applicant.full_name || '', phone: applicant.phone || '', email: applicant.email || '',
      nationality: applicant.nationality || '', semester: applicant.semester || '', year: applicant.year || '',
      electronic_payment_no: applicant.electronic_payment_no || '', application_no: applicant.application_no || '',
      application_date: applicant.application_date ? applicant.application_date.split('T')[0] : '',
      payment_date: applicant.payment_date ? applicant.payment_date.split('T')[0] : '',
      paid: applicant.paid || false, heard_about_htu: applicant.heard_about_htu || '',
      major: applicant.major || '', status: applicant.status || 'red', notes: applicant.notes || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const { error } = await supabase.from('applicants').delete().eq('id', id)
    if (!error) fetchApplicants()
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('applicants').update({ status: newStatus }).eq('id', id)
    if (!error) fetchApplicants()
  }

  const parseExcelDate = (val) => {
    if (!val) return null
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString()
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString()
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
      const applicants = rows.map(row => ({
        full_name: row['Student Name'] || row['full_name'] || '',
        phone: String(row['Phone number'] || row['phone'] || ''),
        email: row['Email'] || row['email'] || '',
        nationality: row['Nationality'] || row['nationality'] || '',
        semester: String(row['Semester'] || row['semester'] || ''),
        year: parseInt(row['Year'] || row['year']) || null,
        electronic_payment_no: String(row['Electronic Payment No'] || row['electronic_payment_no'] || ''),
        application_no: String(row['Application No'] || row['application_no'] || ''),
        application_date: parseExcelDate(row['Sign up Date'] || row['Date'] || row['application_date']),
        payment_date: parseExcelDate(row['Payment Date'] || row['payment_date']),
        paid: String(row['Paid'] || '').toUpperCase() === 'YES',
        heard_about_htu: row['How did you first hear about (HTU) and early admission?'] || row['heard_about_htu'] || '',
        major: row['Major'] || row['MAJOR'] || row['major'] || '',
        status: String(row['Paid'] || '').toUpperCase() === 'YES' ? 'green' : 'red',
      })).filter(a => a.full_name)
      if (applicants.length === 0) { alert('No valid applicants found'); setImporting(false); e.target.value = ''; return }
      const { error } = await supabase.from('applicants').insert(applicants)
      if (!error) { alert('Successfully imported ' + applicants.length + ' applicants'); fetchApplicants(); runCrossReference() }
      else alert('Error: ' + error.message)
      setImporting(false); e.target.value = ''
    }
    reader.readAsArrayBuffer(file)
  }

 const handleArchive = async () => {
    if (!archiveLabel) { alert('Please enter a label for this archive'); return }
    setArchiving(true)

    const today = new Date().toISOString()
    const { error } = await supabase
      .from('applicants')
      .update({ is_archived: true, archive_label: archiveLabel, archived_at: today })
      .eq('is_archived', false)

    if (!error) {
      alert('Successfully archived ' + applicants.length + ' applicants')
      setShowArchiveModal(false)
      setArchiveLabel('')
      fetchApplicants()
    } else {
      alert('Error archiving: ' + error.message)
    }
    setArchiving(false)
  }

  const runCrossReference = async () => {
    const { data: visitStudents } = await supabase.from('visit_students').select('id, full_name, phone, email')
    const { data: currentApplicants } = await supabase.from('applicants').select('id, full_name, phone, email')
    if (!visitStudents || !currentApplicants) return
    for (const vs of visitStudents) {
      const match = currentApplicants.find(a =>
        a.full_name?.toLowerCase() === vs.full_name?.toLowerCase() &&
        (a.phone === vs.phone || a.email === vs.email)
      )
      if (match) {
        await supabase.from('matches').upsert({ visit_student_id: vs.id, applicant_name: match.full_name, applicant_email: match.email, applicant_phone: match.phone }, { onConflict: 'visit_student_id' })
        await supabase.from('visit_students').update({ is_matched: true, matched_applicant_id: match.id }).eq('id', vs.id)
        await supabase.from('applicants').update({ is_matched: true, matched_visit_student_id: vs.id }).eq('id', match.id)
      }
    }
    const { data: savedMatches } = await supabase.from('matches').select('*')
    if (savedMatches) {
      for (const m of savedMatches) {
        const applicant = currentApplicants.find(a =>
          a.full_name?.toLowerCase() === m.applicant_name?.toLowerCase() &&
          (a.phone === m.applicant_phone || a.email === m.applicant_email)
        )
        if (applicant) await supabase.from('applicants').update({ is_matched: true, matched_visit_student_id: m.visit_student_id }).eq('id', applicant.id)
      }
    }
    fetchApplicants()
  }

  const nationalities = [...new Set(applicants.map(a => a.nationality).filter(Boolean))].sort()

  const filteredApplicants = applicants.filter(a => {
    const matchSearch = !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search)
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchMajor = filterMajor === 'all' || a.major === filterMajor
    const matchNationality = filterNationality === 'all' || a.nationality === filterNationality
    return matchSearch && matchStatus && matchMajor && matchNationality
  })

  const getRowBg = (status) => status === 'green' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
    select: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Applicants</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage all applicants and their status</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
            <Upload size={14} />
            {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button
            onClick={() => setShowArchiveModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}
          >
            <Archive size={14} />
            Archive
          </button>
          <button onClick={() => router.push('/dashboard/archive')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#a78bfa', cursor: 'pointer' }}>
            View Archives
          </button>
          <button onClick={() => { setShowForm(true); setEditingApplicant(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Applicant
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            style={{ ...s.input, paddingLeft: '36px' }}
          />
        </div>
        {['all', 'red', 'green'].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterStatus === status ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: filterStatus === status ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <select value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} style={s.select}>
          <option value="all">All Majors</option>
          {majors.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterNationality} onChange={(e) => setFilterNationality(e.target.value)} style={s.select}>
          <option value="all">All Nationalities</option>
          {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>{filteredApplicants.length} applicants</span>
      </div>

      {/* Table */}
      <div style={{ ...s.card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
          <thead>
            <tr>
              {['Name', 'Phone', 'Email', 'Nationality', 'Semester', 'Year', 'Payment No', 'App No', 'Sign Up Date', 'Payment Date', 'Paid', 'Heard About HTU', 'Major', 'Notes', 'Matched', 'Status', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={17} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : filteredApplicants.length === 0 ? (
              <tr><td colSpan={17} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No applicants found</td></tr>
            ) : (
              filteredApplicants.map((applicant) => (
                <tr key={applicant.id} style={{ background: getRowBg(applicant.status) }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500', cursor: 'pointer' }} onClick={() => router.push('/dashboard/applicants/' + applicant.id)}>
                    {applicant.full_name}
                    {applicant.is_matched && <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>✓ Visit</span>}
                  </td>
                  <td style={s.td}>{applicant.phone || '-'}</td>
                  <td style={s.td}>{applicant.email || '-'}</td>
                  <td style={s.td}>{applicant.nationality || '-'}</td>
                  <td style={s.td}>{applicant.semester || '-'}</td>
                  <td style={s.td}>{applicant.year || '-'}</td>
                  <td style={s.td}>{applicant.electronic_payment_no || '-'}</td>
                  <td style={s.td}>{applicant.application_no || '-'}</td>
                  <td style={s.td}>{applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : '-'}</td>
                  <td style={s.td}>{applicant.payment_date ? new Date(applicant.payment_date).toLocaleDateString() : '-'}</td>
                  <td style={s.td}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: applicant.paid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: applicant.paid ? '#10b981' : '#ef4444' }}>
                      {applicant.paid ? 'Paid' : 'Not Paid'}
                    </span>
                  </td>
                  <td style={{ ...s.td, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{applicant.heard_about_htu || '-'}</td>
                  <td style={s.td}>{applicant.major || '-'}</td>
                  <td style={{ ...s.td, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{applicant.notes || '-'}</td>
                  <td style={s.td}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: applicant.is_matched ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', color: applicant.is_matched ? '#60a5fa' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                      {applicant.is_matched ? '✓ Matched' : 'No match'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <select value={applicant.status} onChange={(e) => handleStatusChange(applicant.id, e.target.value)} style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: applicant.status === 'green' ? '#10b981' : '#ef4444', outline: 'none' }}>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(applicant)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(applicant.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
              {editingApplicant ? 'Edit Applicant' : 'Add New Applicant'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Full Name *', key: 'full_name', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Nationality', key: 'nationality', type: 'text' },
                { label: 'Semester', key: 'semester', type: 'text' },
                { label: 'Year', key: 'year', type: 'number' },
                { label: 'Electronic Payment No', key: 'electronic_payment_no', type: 'text' },
                { label: 'Application No', key: 'application_no', type: 'text' },
                { label: 'Sign Up Date', key: 'application_date', type: 'date' },
                { label: 'Payment Date', key: 'payment_date', type: 'date' },
                { label: 'How did you hear about HTU?', key: 'heard_about_htu', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label style={s.label}>{field.label}</label>
                  <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>Major</label>
                <select value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} style={s.input}>
                  <option value="">Select a major</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Paid</label>
                <select value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value === 'true' })} style={s.input}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={s.input}>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this applicant..." rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingApplicant ? 'Save Changes' : 'Add Applicant'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingApplicant(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div style={s.modal}>
          <div style={{ ...s.modalCard, maxWidth: '400px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>Archive Applicants</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>
              This will archive all {applicants.length} current applicants and clear the list.
            </p>
            <div>
              <label style={s.label}>Archive Label *</label>
              <input
                type="text"
                value={archiveLabel}
                onChange={(e) => setArchiveLabel(e.target.value)}
                placeholder="e.g. Week 1 - March 2026"
                style={s.input}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleArchive} disabled={archiving} style={{ flex: 1, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', opacity: archiving ? 0.5 : 1 }}>
                {archiving ? 'Archiving...' : 'Archive & Clear'}
              </button>
              <button onClick={() => { setShowArchiveModal(false); setArchiveLabel('') }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}