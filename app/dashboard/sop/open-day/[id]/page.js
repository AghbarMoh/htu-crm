'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'

const s = {
  td: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' },
  th: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', padding: '0 0 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px' },
}

export default function OpenDayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [openDay, setOpenDay] = useState(null)
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/open-day?id=${id}`)
      const json = await res.json()
      if (json.openDay) setOpenDay(json.openDay)
      if (json.visitors) setVisitors(json.visitors)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) fetchData() }, [id])

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const [editingVisitor, setEditingVisitor] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})

  const handleDeleteVisitor = async (visitorId) => {
    if (!confirm('Delete this visitor submission?')) return
    await fetch('/api/open-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_visitor', payload: { id: visitorId } })
    })
    fetchData()
  }

  const handleUpdateVisitor = async () => {
    await fetch('/api/open-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_visitor', payload: editForm })
    })
    setShowEditModal(false)
    setEditingVisitor(null)
    fetchData()
  }

  const openEditModal = (v) => {
    setEditingVisitor(v)
    setEditForm({ ...v })
    setShowEditModal(true)
  }

  const formatDateTime = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const exportCSV = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Date of Birth', 'Feedback', 'Submitted At']
    const rows = visitors.map(v => [
      v.full_name, v.phone || '', v.email || '',
      v.date_of_birth || '',
      (v.feedback || '').replace(/,/g, ';'), formatDateTime(v.submitted_at)
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${openDay?.label || 'open-day'}-visitors.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* UPDATED BACK BUTTON ROUTE HERE */}
          <button onClick={() => router.push('/dashboard/sop/open-day')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.4px' }}>
              {loading ? 'Loading...' : openDay?.label || 'Open Day'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
              {openDay ? formatDate(openDay.event_date) : ''} · {visitors.length} visitor{visitors.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {visitors.length > 0 && (
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.25)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#3ecf8e', cursor: 'pointer' }}>
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Loading...</div>
        ) : visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
            No visitors have submitted yet for this open day.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Full Name', 'Phone', 'Email', 'Date of Birth', 'Feedback', 'Submitted At', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, i) => (
                  <tr key={v.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...s.td, color: 'rgba(255,255,255,0.25)', width: '36px' }}>{i + 1}</td>
                    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{v.full_name}</td>
                    <td style={s.td}>{v.phone || '-'}</td>
                    <td style={s.td}>{v.email || '-'}</td>
                    <td style={s.td}>{v.date_of_birth ? formatDate(v.date_of_birth) : '-'}</td>
                    <td style={{ ...s.td, maxWidth: '220px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.feedback}>
                        {v.feedback || '-'}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateTime(v.submitted_at)}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditModal(v)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDeleteVisitor(v.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Visitor Modal */}
      {showEditModal && editingVisitor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '460px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>Edit Visitor</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Full Name</label>
                <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none' }} value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Phone</label>
                <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none' }} value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Email</label>
                <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none' }} value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Date of Birth</label>
                <input type="date" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none' }} value={editForm.date_of_birth || ''} onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Feedback</label>
                <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: '80px' }} value={editForm.feedback || ''} onChange={e => setEditForm({ ...editForm, feedback: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleUpdateVisitor} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>Save Changes</button>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}