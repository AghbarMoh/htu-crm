'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Trash2, QrCode, Users, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

const s = {
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalCard: { background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '460px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' },
  input: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', color: '#ffffff', fontFamily: 'inherit', outline: 'none' },
  label: { fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px', height: '100%' },
  th: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', padding: '0 0 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' },
}

export default function OpenDayPage() {
  const [openDays, setOpenDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [activeQR, setActiveQR] = useState(null)
  const [form, setForm] = useState({ label: '', event_date: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/open-day')
      const json = await res.json()
      if (json.openDays) setOpenDays(json.openDays)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async () => {
    if (!form.label || !form.event_date) { alert('Please fill in all fields'); return }
    setSaving(true)
    await fetch('/api/open-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'insert_open_day', payload: form })
    })
    setSaving(false)
    setShowForm(false)
    setForm({ label: '', event_date: '' })
    fetchData()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this open day and all its visitor submissions?')) return
    await fetch('/api/open-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_open_day', payload: { id } })
    })
    fetchData()
  }

  const openQR = (day) => { setActiveQR(day); setShowQR(true) }

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getQRUrl = (id) => `${typeof window !== 'undefined' ? window.location.origin : ''}/apply-openday/${id}`

  const handlePrintQR = (day) => {
    const url = getQRUrl(day.id)
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>QR - ${day.label}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Inter,sans-serif;background:#fff;}
      h2{margin-bottom:8px;font-size:22px;}p{color:#555;margin-bottom:24px;font-size:15px;}
      img{width:240px;height:240px;}
      </style></head>
      <body>
        <h2>${day.label}</h2>
        <p>${formatDate(day.event_date)}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}" />
        <p style="margin-top:20px;font-size:12px;color:#999;">${url}</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.4px' }}>Open Days</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>Manage open day events and generate visitor QR codes</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}
        >
          <Plus size={15} /> Add Open Day
        </button>
      </div>

      <div>
        <div style={s.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Loading...</div>
          ) : openDays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Calendar size={20} color="rgba(255,255,255,0.2)" />
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>No open days yet. Add your first one.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr>
                    {['#', 'Label', 'Date', 'Visitors', 'QR Code', 'Actions'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openDays.map((day, i) => (
                    <tr key={day.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...s.td, width: '36px', color: 'rgba(255,255,255,0.25)' }}>{i + 1}</td>
                      <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{day.label}</td>
                      <td style={s.td}>{formatDate(day.event_date)}</td>
                      <td style={s.td}>
                        {/* UPDATED LINK PATH TO INCLUDE /SOP */}
                        <Link href={`/dashboard/sop/open-day/${day.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.22)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#4f8ef7', fontWeight: '500', textDecoration: 'none' }}>
                          <Users size={12} /> View Submissions
                        </Link>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => openQR(day)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139,124,248,0.12)', border: '1px solid rgba(139,124,248,0.22)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#8b7cf8', fontWeight: '500', cursor: 'pointer' }}>
                          <QrCode size={12} /> Show QR
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(day.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: '4px', display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                        ><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>Add Open Day</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>Label *</label>
                <input style={s.input} placeholder="e.g. HTU Open Day - Spring 2027" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Event Date *</label>
                <input type="date" style={s.input} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Create Open Day'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && activeQR && (
        <div style={s.modal} onClick={() => setShowQR(false)}>
          <div style={{ ...s.modalCard, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>{activeQR.label}</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px 0' }}>{formatDate(activeQR.event_date)}</p>

            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
              <QRCodeSVG
                value={getQRUrl(activeQR.id)}
                size={210}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px 0', lineHeight: '1.6' }}>
              Students scan this code to submit their visit information.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', flex: 1, wordBreak: 'break-all', textAlign: 'left' }}>
                {getQRUrl(activeQR.id)}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(getQRUrl(activeQR.id)); alert('Link copied!') }}
                style={{ background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', fontWeight: '600', color: '#4f8ef7', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Copy Link
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handlePrintQR(activeQR)}
                style={{ flex: 1, background: 'rgba(139,124,248,0.15)', border: '1px solid rgba(139,124,248,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', color: '#8b7cf8', cursor: 'pointer' }}>
                Print QR
              </button>
              <button onClick={() => setShowQR(false)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}