'use client'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react' // <-- NEW IMPORT
import { Plus, Pencil, Trash2, CheckCircle, Filter, ChevronDown, ChevronUp, RotateCcw, FileText, QrCode } from 'lucide-react' // <-- Added QrCode


const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

// Auto-detect text direction based on first character
const getTextDir = (text) => {
   // Safety check: if it's empty OR not a string, default to left-to-right
   if (!text || typeof text !== 'string') return 'ltr'
   
   const firstChar = text.trim()[0]
   if (!firstChar) return 'ltr' // Extra safety for empty spaces

   // Arabic Unicode range
   return /[\u0600-\u06FF]/.test(firstChar) ? 'rtl' : 'ltr'
}

export default function SchoolVisitsPage() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingVisit, setCompletingVisit] = useState(null)
  const [completionComment, setCompletionComment] = useState('')
  const [completionImages, setCompletionImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [completions, setCompletions] = useState({})
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false)
const [isCancelledCollapsed, setIsCancelledCollapsed] = useState(true)
const [isPendingCollapsed, setIsPendingCollapsed] = useState(false)
  
  // NEW QR STATE
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrVisit, setQrVisit] = useState(null)
  
  

  const emptyForm = {
    school_name: '',
    type: 'School Tours',
    city: '',
    country: '',
    private_or_public: 'private',
    visit_date: '',
    visit_time: '',
    connection_status: 'New',
    companion: '',
    reminder_time: 'none', 
    qstash_message_id: null,
    lat: '',
    lng: '',
  }

  const [form, setForm] = useState(emptyForm)

  const [visitStudents, setVisitStudents] = useState([])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/visits')
      const json = await res.json()
      
      if (json.visits) setVisits(json.visits)
      if (json.students) setVisitStudents(json.students)
      if (json.completions) {
        const map = {}
        json.completions.forEach(c => { map[c.visit_id] = c })
        setCompletions(map)
      }
    } catch (error) {
      console.error("Failed to fetch visits data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

 const handleSubmit = async () => {
    if (!form.school_name || !form.visit_date || !form.visit_time) {
      alert('Please fill in school name, visit date, and visit time to set a reminder.')
      return
    }

        // Use manually entered coordinates
    const lat = form.lat ? parseFloat(form.lat) : (editingVisit?.lat || null)
    const lng = form.lng ? parseFloat(form.lng) : (editingVisit?.lng || null)


    const payload = {
      ...form,
      lat, // Add latitude to database
      lng, // Add longitude to database
      visit_time: form.visit_time === '' ? null : form.visit_time,
    }
    const action = editingVisit ? 'update' : 'insert'
    if (editingVisit) payload.id = editingVisit.id

    let savedVisit;
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      })
      const json = await res.json()
      if (json.error) { alert('Error: ' + json.error); return }
      savedVisit = json.data
    } catch (err) {
      console.error("Submission error:", err)
      return
    }
    
    try {
      if (form.reminder_time !== 'none' && savedVisit) {
        const res = await fetch('/api/schedule-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit_id: savedVisit.id,
            school_name: savedVisit.school_name,
            visit_date: savedVisit.visit_date,
            visit_time: savedVisit.visit_time,
            reminder: savedVisit.reminder_time,
            old_message_id: savedVisit.qstash_message_id
          })
        });
        const scheduleData = await res.json();
        if (scheduleData.error) alert(scheduleData.error);
        if (scheduleData.messageId) {
          // Update the QStash ID securely via proxy
          await fetch('/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_qstash', payload: { id: savedVisit.id, qstash_message_id: scheduleData.messageId } })
          })
        }
      }
    } catch (err) {
      console.error("Failed to schedule reminder:", err);
    }

    fetchAllData()
    setShowForm(false)
    setEditingVisit(null)
    setForm(emptyForm)
  }

  const handleEdit = (visit) => {
    setEditingVisit(visit)
    setForm({
      school_name: visit.school_name,
      type: visit.type,
      city: visit.city || '',
      country: visit.country || '',
      private_or_public: visit.private_or_public,
      visit_date: visit.visit_date,
      visit_time: visit.visit_time || '',
      connection_status: visit.connection_status || 'New',
      companion: visit.companion || '',
      reminder_time: visit.reminder_time || '60',
      qstash_message_id: visit.qstash_message_id || null,
      lat: visit.lat || '',
      lng: visit.lng || '',
    })
    setShowForm(true)
  }

  
  const handleMarkDone = (visit) => {
    setCompletingVisit(visit)
    setCompletionComment('')
    setCompletionImages([])
    setShowCompleteModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setUploadingImages(true)
    const uploadedUrls = []
    
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'task-images') // Keeping the same bucket you used

      try {
        const res = await fetch('/api/storage', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()
        if (json.url) uploadedUrls.push(json.url)
      } catch (error) {
        console.error("Upload proxy error:", error)
      }
    }
    
    setCompletionImages(prev => [...prev, ...uploadedUrls])
    setUploadingImages(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this visit?')) return
    const visit = visits.find(v => v.id === id)
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id, school_name: visit?.school_name } })
    })
    fetchAllData()
  }

  const handleCompleteSubmit = async () => {
    if (!completionComment) return alert('Please write what you accomplished during this visit')
    
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', payload: { visit_id: completingVisit.id, comment: completionComment, images: completionImages, school_name: completingVisit.school_name } })
    })
    setShowCompleteModal(false)
    setCompletingVisit(null)
    setCompletionComment('')
    setCompletionImages([])
    fetchAllData()
  }
const handleCancel = async (visitId) => {
    if (!confirm('Mark this visit as cancelled? It will be stored under Cancelled Visits.')) return
    const visit = visits.find(v => v.id === visitId)
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', payload: { id: visitId, school_name: visit?.school_name } })
    })
    fetchAllData()
  }

  const handleUncancel = async (visitId) => {
    const visit = visits.find(v => v.id === visitId)
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'uncancel', payload: { id: visitId, school_name: visit?.school_name } })
    })
    fetchAllData()
  }
  const handleUndoComplete = async (visitId) => {
    if (!confirm('Are you sure you want to undo this completion?')) return
    const visit = visits.find(v => v.id === visitId)
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'undo_complete', payload: { visit_id: visitId, school_name: visit?.school_name } })
    })
    fetchAllData()
  }


  const filteredVisits = filterType === 'all' ? visits : visits.filter(v => v.type === filterType)
  const pendingVisits = filteredVisits.filter(v => !completions[v.id] && !v.is_cancelled)
const completedVisits = filteredVisits.filter(v => completions[v.id] && !v.is_cancelled)
const cancelledVisits = filteredVisits.filter(v => v.is_cancelled)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', backgroundColor: '#1a1a2e', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>School Visits</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage all school tours and fair visits</p>
        </div>
       <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.open('/api/visits/export?filter=pending', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}>
  <FileText size={16} /> Export Pending
</button>
<button onClick={() => window.open('/api/visits/export?filter=completed', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
  <FileText size={16} /> Export Completed
</button>
          <button onClick={() => { setShowForm(true); setEditingVisit(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            <Plus size={16} /> Add Visit
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'School Tours', 'School visits at HTU Campus', 'School Fairs'].map(type => (
          <button key={type} onClick={() => setFilterType(type)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterType === type ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === type ? '#3b82f6' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setIsPendingCollapsed(!isPendingCollapsed)}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>Upcoming / Pending Visits ({pendingVisits.length})</h2>
        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
          {isPendingCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      {!isPendingCollapsed && <div style={{ ...s.card, marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
  <tr>{['#', 'School Name', 'Type', 'School Type', 'City', 'Date', 'Time', 'Status', 'Companion','Accomplished', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
</thead>
<tbody>
  {loading ? <tr><td colSpan={11} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>Loading...</td></tr> : 
   pendingVisits.length === 0 ? <tr><td colSpan={11} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No pending visits</td></tr> :
             pendingVisits.map((visit, i) => (
  <tr key={visit.id} style={{ transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500', direction: getTextDir(visit.school_name), textAlign: getTextDir(visit.school_name) === 'rtl' ? 'right' : 'left' }}>{visit.school_name}</td>
                  <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{visit.type}</span></td>
                  <td style={s.td}><span style={{ textTransform: 'capitalize' }}>{visit.private_or_public || '-'}</span></td>
                  <td style={s.td}>{visit.city || '-'}</td>
                  <td style={s.td}>{formatDate(visit.visit_date)}</td>
                  <td style={s.td}>{visit.visit_time || '-'}</td>
                  <td style={s.td}><span style={{ color: visit.connection_status === 'New' ? '#10b981' : '#f59e0b', fontWeight: '500' }}>{visit.connection_status || 'New'}</span></td>
                  <td style={s.td}>{visit.companion || '-'}</td>
                  <td style={s.td}>
                    <button onClick={() => handleMarkDone(visit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <CheckCircle size={13} /> Mark Done
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { 
  setQrVisit(visit); 
  setShowQRModal(true);
  if (!visit.qr_sent) {
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_qr_sent', payload: { id: visit.id } })
    }).then(() => {
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, qr_sent: true } : v))
    })
  }
}} title="QR Kiosk" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><QrCode size={14} /></button>
                      <button onClick={() => handleEdit(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                      <button onClick={() => handleCancel(visit.id)} title="Cancel Visit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}>✕</button>
                      <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                      <button onClick={() => window.open('/api/visits/export?filter=all', '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><FileText size={14} /></button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#10b981' }}>Completed Visits ({completedVisits.length})</h2>
        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
          {isCompletedCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      
      {!isCompletedCollapsed && (
        <div style={{ ...s.card, opacity: 0.8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
  <tr>{['#', 'School Name', 'Type', 'School Type', 'Date','Companion', 'Accomplished', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
</thead>
<tbody>
  {completedVisits.length === 0 ? <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No completed visits yet</td></tr> :
               completedVisits.map((visit, i) => (
  <tr key={visit.id} style={{ background: 'rgba(16,185,129,0.02)' }}>
    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500', textDecoration: 'line-through', opacity: 0.7, direction: getTextDir(visit.school_name), textAlign: getTextDir(visit.school_name) === 'rtl' ? 'right' : 'left' }}>{visit.school_name}</td>
                    <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{visit.type}</span></td>
                    <td style={s.td}><span style={{ textTransform: 'capitalize' }}>{visit.private_or_public || '-'}</span></td>
                    <td style={s.td}>{formatDate(visit.visit_date)}</td>
                    <td style={s.td}>{visit.companion || '-'}</td>
                    <td style={s.td}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✓ Done</span>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completions[visit.id].comment}</p>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { 
  setQrVisit(visit); 
  setShowQRModal(true);
  if (!visit.qr_sent) {
    fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_qr_sent', payload: { id: visit.id } })
    }).then(() => {
      setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, qr_sent: true } : v))
    })
  }
}} title="QR Kiosk" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><QrCode size={14} /></button>
                        <button onClick={() => handleUndoComplete(visit.id)} title="Undo Completion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}><RotateCcw size={14} /></button>
                        <button onClick={() => handleEdit(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                        <button onClick={() => window.open('/api/visits/export?filter=all', '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><FileText size={14} /></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
{/* Cancelled Visits Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', marginTop: '32px', cursor: 'pointer' }} onClick={() => setIsCancelledCollapsed(!isCancelledCollapsed)}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444' }}>Cancelled Visits ({cancelledVisits.length})</h2>
        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
          {isCancelledCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isCancelledCollapsed && (
        <div style={{ ...s.card, opacity: 0.7 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'School Name', 'Type', 'Date', 'Companion', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {cancelledVisits.length === 0 ? <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No cancelled visits</td></tr> :
                cancelledVisits.map((visit, i) => (
                  <tr key={visit.id} style={{ background: 'rgba(239,68,68,0.03)' }}>
                    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                    <td style={{ ...s.td, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textDecoration: 'line-through' }}>{visit.school_name}</td>
                    <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{visit.type}</span></td>
                    <td style={s.td}>{formatDate(visit.visit_date)}</td>
                    <td style={s.td}>{visit.companion || '-'}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUncancel(visit.id)} title="Restore Visit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '12px' }}>↩ Restore</button>
                        <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add/Edit Modal */}
      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>{editingVisit ? 'Edit Visit' : 'Add New Visit'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'School Name *', key: 'school_name', type: 'text', placeholder: 'e.g. Al-Ahliyya School' },
                { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. Amman' },
                { label: 'Country', key: 'country', type: 'text', placeholder: 'e.g. Jordan' },
                { label: 'Visit Date *', key: 'visit_date', type: 'date', placeholder: '' },
                { label: 'Visit Time', key: 'visit_time', type: 'time', placeholder: '' },
{ label: 'Latitude (optional)', key: 'lat', type: 'number', placeholder: 'e.g. 31.9539' },
{ label: 'Longitude (optional)', key: 'lng', type: 'number', placeholder: 'e.g. 35.9106' },
              ].map(field => (
                <div key={field.key}>
                  <label style={s.label}>{field.label}</label>
                  <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ ...s.input, direction: getTextDir(form[field.key]) }} />
                </div>
              ))}
              <div>
                <label style={s.label}>Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s.input}>
  {[
    "School Tours", "School visits at HTU Campus", "School Fairs"
  ].map(opt => (
    <option key={opt} value={opt} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
      {opt}
    </option>
  ))}
</select>
              </div>
              <div>
  <label style={s.label}>School Type *</label>
  <select value={form.private_or_public} onChange={(e) => setForm({ ...form, private_or_public: e.target.value })} style={s.input}>
    <option value="private" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Private</option>
    <option value="public" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Public</option>
  </select>
</div>
              <div>
                <label style={s.label}>Companion</label>
                <input type="text" value={form.companion} onChange={(e) => setForm({ ...form, companion: e.target.value })} placeholder="e.g. Aghbar" style={{ ...s.input, direction: getTextDir(form.companion) }} />
              </div>
              <div>
  <label style={s.label}>Status (New/Repeated) *</label>
  <select value={form.connection_status} onChange={(e) => setForm({ ...form, connection_status: e.target.value })} style={s.input}>
    <option value="New" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>New</option>
    <option value="Repeated" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Repeated</option>
  </select>
</div>
              <div>
  <label style={s.label}>Reminder Notice *</label>
  <select value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} style={s.input}>
    {[
      { val: 'none', lab: 'No Reminder' },
      { val: '30', lab: '30 Minutes Before' },
      { val: '60', lab: '1 Hour Before' },
      { val: '120', lab: '2 Hours Before' },
      { val: '1440', lab: '1 Day Before' },
      { val: '2880', lab: '2 Days Before' },
      { val: '10080', lab: '1 Week Before' }
    ].map(r => (
      <option key={r.val} value={r.val} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
        {r.lab}
      </option>
    ))}
  </select>
</div>
            </div>
          
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>{editingVisit ? 'Save Changes' : 'Add Visit'}</button>
              <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Visit Modal */}
      {showCompleteModal && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>Visit Accomplished</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>"{completingVisit?.school_name}"</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>What did you accomplish? *</label>
                <textarea value={completionComment} onChange={(e) => setCompletionComment(e.target.value)} placeholder="e.g. Met with 30 students, collected 25 contacts..." rows={4} style={{ ...s.input, resize: 'vertical', direction: getTextDir(completionComment) }} />
              </div>
              <div>
                <label style={s.label}>Attach Photos (optional)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  {uploadingImages ? 'Uploading...' : '+ Add Photos'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {completionImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {completionImages.map((url, i) => (
                      <img key={i} src={url} alt="upload" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleCompleteSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setShowCompleteModal(false); setCompletingVisit(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: QR Kiosk Modal */}
      {showQRModal && qrVisit && (
        <div style={s.modal} onClick={() => setShowQRModal(false)}>
          <div style={{ ...s.modalCard, textAlign: 'center', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>Student Sign-Up Kiosk</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 24px 0' }}>{qrVisit.school_name}</p>

            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px' }}>
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${qrVisit.id}`}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
              />
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              Students can scan this code with their phones to securely enter their contact information.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', flex: 1, wordBreak: 'break-all' }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/apply/${qrVisit.id}` : ''}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/apply/${qrVisit.id}`)
                  alert('Link copied!')
                }}
                style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Copy Link
              </button>
            </div>

            <button onClick={() => setShowQRModal(false)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
              Close Kiosk
            </button>
          </div>
        </div>
      )}
    </div>
  )
}