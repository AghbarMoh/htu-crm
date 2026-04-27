'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, ChevronDown, ChevronUp, RotateCcw, FileText, QrCode, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

// ── Budget Component (embedded) ────────────────────────────────
function BudgetTab() {
  const [pendingVisits, setPendingVisits] = useState([])
  const [form, setForm] = useState({
    visitType: '', companion: '', date: '', hourFrom: '', hourTo: '',
    costFields: [], notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [error, setError] = useState('')
  const total = form.costFields.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)

  useEffect(() => {
    fetch('/api/outreach')
      .then(r => r.json())
      .then(({ visits, completions }) => {
        const completedIds = new Set((completions || []).map(c => c.visit_id))
        const pending = (visits || []).filter(v => !completedIds.has(v.id) && !v.is_cancelled)
        setPendingVisits(pending)
      }).catch(() => {})
  }, [])

  function setField(key, val) { setForm(p => ({ ...p, [key]: val })) }
  function addCostField() { setForm(p => ({ ...p, costFields: [...p.costFields, { label: '', amount: '' }] })) }
  function updateCostField(i, key, val) { setForm(p => { const f = [...p.costFields]; f[i] = { ...f[i], [key]: val }; return { ...p, costFields: f } }) }
  function removeCostField(i) { setForm(p => ({ ...p, costFields: p.costFields.filter((_, idx) => idx !== i) })) }

  async function handleSave() {
    if (!form.visitType || !form.date) { setError('Visit type and date are required.'); return }
    setError(''); setSaving(true)
    try {
      const res = await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', payload: { ...form, total } }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedId(data.request?.id ?? null); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function handleExport() {
    if (!form.visitType || !form.date) { setError('Fill visit type and date before exporting.'); return }
    setError('')
    if (savedId) { window.open(`/api/budget/export?id=${savedId}`, '_blank'); return }
    const params = new URLSearchParams({ visit_type: form.visitType, companion: form.companion, date: form.date, hour_from: form.hourFrom, hour_to: form.hourTo, total: total.toString(), notes: form.notes, cost_fields: encodeURIComponent(JSON.stringify(form.costFields)) })
    window.open(`/api/budget/export?${params.toString()}`, '_blank')
  }

  const inp = { width: '100%', background: '#12121c', border: '1px solid #23233a', borderRadius: '8px', padding: '9px 12px', color: '#e8e8f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '11px', color: '#7070a0', marginBottom: '5px', display: 'block', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }
  const sec = { background: '#181824', border: '1px solid #ffffff0d', borderRadius: '12px', padding: '20px 22px', marginBottom: '14px' }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#e8e8f0' }}>Budget Request</div>
        <div style={{ fontSize: '12px', color: '#55556a', marginTop: '3px' }}>Outreach trip cost planner · HTU SRO CRM</div>
      </div>
      <div style={sec}>
        <div style={{ fontSize: '12px', color: '#7070a0', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '16px' }}>Trip Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div><label style={lbl}>Visit Type *</label><select value={form.visitType} onChange={e => setField('visitType', e.target.value)} style={inp}><option value=''>Select type…</option>{pendingVisits.map(v => <option key={v.id} value={v.type}>{v.school_name} — {v.type} ({v.visit_date})</option>)}</select></div>
          <div><label style={lbl}>Companion</label><input value={form.companion} onChange={e => setField('companion', e.target.value)} placeholder='Name…' style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div><label style={lbl}>Date *</label><input type='date' value={form.date} onChange={e => setField('date', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Hour From</label><input type='time' value={form.hourFrom} onChange={e => setField('hourFrom', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Hour To</label><input type='time' value={form.hourTo} onChange={e => setField('hourTo', e.target.value)} style={inp} /></div>
        </div>
      </div>
      <div style={sec}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#7070a0', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Cost Breakdown</div>
          <button onClick={addCostField} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add item</button>
        </div>
        {form.costFields.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: '#55556a', fontSize: '13px' }}>No cost items yet</div>}
        {form.costFields.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            <input value={f.label} onChange={e => updateCostField(i, 'label', e.target.value)} placeholder='e.g. Visa, Pocket Money…' style={inp} />
            <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7070a0', fontSize: '12px' }}>JD</span><input type='number' min='0' step='0.01' value={f.amount} onChange={e => updateCostField(i, 'amount', e.target.value)} placeholder='0.00' style={{ ...inp, paddingLeft: '30px' }} /></div>
            <button onClick={() => removeCostField(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '5px' }} onMouseEnter={e => e.currentTarget.style.color = '#f06595'} onMouseLeave={e => e.currentTarget.style.color = '#55556a'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        ))}
        {form.costFields.length > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #ffffff0d', marginTop: '4px' }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#3ecf8e' }}>Total: JD {total.toFixed(2)}</div></div>}
      </div>
      <div style={sec}><label style={lbl}>Notes</label><textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder='Any additional notes…' rows={3} style={{ ...inp, resize: 'vertical' }} /></div>
      {error && <div style={{ color: '#f06595', fontSize: '13px', marginBottom: '14px', padding: '10px 14px', background: '#2a0f1a', border: '1px solid #4a1a2a', borderRadius: '8px' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: saving ? '#1a2d52' : '#1a3d2a', border: `1px solid ${saving ? '#2a4a80' : '#1a5c42'}`, color: saving ? '#4f8ef7' : '#3ecf8e', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Request'}</button>
        <button onClick={handleExport} style={{ padding: '10px 20px', borderRadius: '8px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px' }}>⬇ Export as PDF</button>
      </div>
    </div>
  )
}

// ── Report Editor Modal ────────────────────────────────────────
const REPORT_SECTIONS = [
  { key: 'purpose', label: 'Purpose & Objectives' },
  { key: 'schools', label: 'Schools / Institutions Visited' },
  { key: 'activities', label: 'Summary of Activities' },
  { key: 'leads', label: 'Student Engagement & Leads' },
  { key: 'insights', label: 'Market Insights & Observations' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'weaknesses', label: 'Weaknesses / Challenges' },
  { key: 'recommendations', label: 'Recommendations & Next Steps' },
]

function ReportModal({ visit, onClose }) {
  const [data, setData] = useState(visit.report_data || {})
  const [saving, setSaving] = useState(false)
  const [activeSections, setActiveSections] = useState(
    Object.fromEntries(REPORT_SECTIONS.map(s => [s.key, true]))
  )

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  // --- Dynamic Schools Helper ---
  const schoolsList = Array.isArray(data.schools) ? data.schools : []
  const updateSchool = (index, field, val) => {
    const newSchools = [...schoolsList]
    newSchools[index] = { ...newSchools[index], [field]: val }
    update('schools', newSchools)
  }
  const addSchool = () => update('schools', [...schoolsList, { schoolName: '', counselor: '', email: '' }])
  const removeSchool = (index) => update('schools', schoolsList.filter((_, i) => i !== index))

  // --- Auto-Bullet Helper ---
  const handleKeyDown = (e, key) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const val = e.target.value
      const newVal = val.substring(0, start) + '\n• ' + val.substring(end)
      update(key, newVal)
      // Move cursor to after the new bullet
      setTimeout(() => { if(e.target) e.target.selectionStart = e.target.selectionEnd = start + 3 }, 0)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/outreach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_report', payload: { visit_id: visit.id, report_data: data } }),
      })
      onClose()
    } catch (e) { alert('Save failed: ' + e.message) } finally { setSaving(false) }
  }

  function handleGeneratePDF() {
    const selected = REPORT_SECTIONS.filter(s => activeSections[s.key]).map(s => s.key).join(',')
    window.open(`/api/outreach/export?id=${visit.id}&sections=${selected}`, '_blank')
  }

  const inp = { width: '100%', background: '#12121c', border: '1px solid #23233a', borderRadius: '8px', padding: '9px 12px', color: '#e8e8f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '11px', color: '#7070a0', marginBottom: '5px', display: 'block', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>Outreach Visit Report</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>{visit.name} — {visit.type}</p>

        {/* Section toggles */}
        <div style={{ background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7070a0', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Include in PDF</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {REPORT_SECTIONS.map(s => (
              <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: activeSections[s.key] ? '#e8e8f0' : '#55556a', cursor: 'pointer' }}>
                <input type="checkbox" checked={activeSections[s.key]} onChange={() => setActiveSections(prev => ({ ...prev, [s.key]: !prev[s.key] }))} style={{ accentColor: '#4f8ef7', cursor: 'pointer' }} />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        {/* Section fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {REPORT_SECTIONS.map(s => {
            // Special UI for the Schools Section
            if (s.key === 'schools') {
              return (
                <div key={s.key} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ ...lbl, margin: 0, color: '#e8e8f0' }}>{s.label}</label>
                    <button onClick={addSchool} style={{ background: '#1a2d52', border: 'none', color: '#4f8ef7', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>+ Add School</button>
                  </div>
                  {schoolsList.length === 0 && <div style={{ fontSize: '12px', color: '#55556a', fontStyle: 'italic' }}>No schools added yet. Click above to add.</div>}
                  {schoolsList.map((school, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <input dir="auto" value={school.schoolName || ''} onChange={e => updateSchool(i, 'schoolName', e.target.value)} placeholder="School Name" style={inp} />
                      <input dir="auto" value={school.counselor || ''} onChange={e => updateSchool(i, 'counselor', e.target.value)} placeholder="Counselor Name" style={inp} />
                      <input dir="auto" value={school.email || ''} onChange={e => updateSchool(i, 'email', e.target.value)} placeholder="Email Address" style={inp} />
                      <button onClick={() => removeSchool(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove">✕</button>
                    </div>
                  ))}
                </div>
              )
            }

            // Standard UI for all other text sections (with RTL and Auto-Bullets)
            return (
              <div key={s.key}>
                <label style={lbl}>{s.label}</label>
                <textarea 
                  dir="auto" 
                  value={data[s.key] || ''} 
                  onChange={e => update(s.key, e.target.value)} 
                  onKeyDown={e => handleKeyDown(e, s.key)}
                  placeholder={`• Type ${s.label.toLowerCase()} here…\n• Press Enter to create a new bullet point`} 
                  rows={4} 
                  style={{ ...inp, resize: 'vertical', lineHeight: '1.6' }} 
                />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px 20px', borderRadius: '8px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={handleGeneratePDF} style={{ flex: 1, padding: '10px 20px', borderRadius: '8px', background: '#1a3d2a', border: '1px solid #1a5c42', color: '#3ecf8e', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px' }}>⬇ Generate PDF</button>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Outreach Visits Tab ─────────────────────────────────────────
const OUTREACH_TYPES = ['Outreach fairs', 'Outreach School Tours', 'Outreach Events']

function OutreachVisitsTab() {
  const [visits, setVisits] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingVisit, setCompletingVisit] = useState(null)
  const [completionComment, setCompletionComment] = useState('')
  const [completionImages, setCompletionImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false)
  const [isCancelledCollapsed, setIsCancelledCollapsed] = useState(true)
  const [isPendingCollapsed, setIsPendingCollapsed] = useState(false)
  const [reportVisit, setReportVisit] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrVisit, setQrVisit] = useState(null)
  const [copied, setCopied] = useState(false)

  const emptyForm = { name: '', type: 'Outreach fairs', city: '', country: '', date_from: '', date_to: '', time_from: '', time_to: '', companion: '', connection_status: 'New' }
  const [form, setForm] = useState(emptyForm)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/outreach')
      const json = await res.json()
      if (json.visits) setVisits(json.visits)
      if (json.completions) {
        const map = {}; json.completions.forEach(c => { map[c.visit_id] = c }); setCompletions(map)
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.date_from || !form.date_to) { alert('Name, date from, and date to are required'); return }
    const action = editingVisit ? 'update' : 'insert'
    const payload = editingVisit ? { ...form, id: editingVisit.id } : form
    try {
      const res = await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) })
      if (!res.ok) { const d = await res.json(); alert(d.error); return }
      fetchAll(); setShowForm(false); setEditingVisit(null); setForm(emptyForm)
    } catch (e) { console.error(e) }
  }

  const handleEdit = (v) => {
    setEditingVisit(v)
    setForm({ name: v.name, type: v.type, city: v.city || '', country: v.country || '', date_from: v.date_from || '', date_to: v.date_to || '', time_from: v.time_from || '', time_to: v.time_to || '', companion: v.companion || '', connection_status: v.connection_status || 'New' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this outreach visit?')) return
    await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', payload: { id, name: visits.find(v => v.id === id)?.name } }) })
    fetchAll()
  }

  const handleCompleteSubmit = async () => {
    if (!completionComment) { alert('Please write what was accomplished'); return }
    await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', payload: { visit_id: completingVisit.id, comment: completionComment, images: completionImages, name: completingVisit.name } }) })
    setShowCompleteModal(false); setCompletingVisit(null); setCompletionComment(''); setCompletionImages([]); fetchAll()
  }
 const handleMarkDone = (v) => {
    setCompletingVisit(v)
    setCompletionComment('')
    setCompletionImages([])
    setShowCompleteModal(true)
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this visit?')) return
    await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', payload: { id, name: visits.find(v => v.id === id)?.name } }) })
    fetchAll()
  }

  const handleUncancel = async (id) => {
    await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'uncancel', payload: { id, name: visits.find(v => v.id === id)?.name } }) })
    fetchAll()
  }

  const handleUndoComplete = async (id) => {
    if (!confirm('Undo completion?')) return
    await fetch('/api/outreach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'undo_complete', payload: { visit_id: id, name: visits.find(v => v.id === id)?.name } }) })
    fetchAll()
  }

  const handleShowQR = (v) => {
    setQrVisit(v)
    setShowQRModal(true)
    setCopied(false)
  }

  const getRegistrationLink = (visitId) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/apply/${visitId}?mode=outreach`
    }
    return ''
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadingImages(true)
    const urls = []
    for (const file of files) {
      const fd = new FormData(); fd.append('file', file); fd.append('bucket', 'task-images')
      try { const r = await fetch('/api/storage', { method: 'POST', body: fd }); const j = await r.json(); if (j.url) urls.push(j.url) } catch (e) {}
    }
    setCompletionImages(prev => [...prev, ...urls]); setUploadingImages(false)
  }

  const filtered = filterType === 'all' ? visits : visits.filter(v => v.type === filterType)
  const pending = filtered.filter(v => !completions[v.id] && !v.is_cancelled)
  const completed = filtered.filter(v => completions[v.id] && !v.is_cancelled)
  const cancelled = filtered.filter(v => v.is_cancelled)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: '#12121c', border: '1px solid #23233a', borderRadius: '8px', padding: '9px 12px', color: '#e8e8f0', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#181824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  const dateRange = (v) => v.date_from && v.date_to ? `${formatDate(v.date_from)} → ${formatDate(v.date_to)}` : '—'
  const formatTime = (t) => {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  const timeRange = (v) => v.time_from && v.time_to ? `${formatTime(v.time_from)} → ${formatTime(v.time_to)}` : '—'

  function formatDate(d) { if (!d) return '—'; const [y,m,dd] = d.split('-'); if (!y||!m||!dd) return d; const ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${parseInt(dd)} ${ms[parseInt(m)-1]} ${y}` }

  const SectionHeader = ({ title, count, collapsed, onToggle }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }} onClick={onToggle}>
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{title} ({count})</h2>
      <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>{collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Outreach Visits</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage outreach tours, fairs and events</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingVisit(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
          <Plus size={16} /> Add Visit
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', ...OUTREACH_TYPES].map(type => (
          <button key={type} onClick={() => setFilterType(type)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterType === type ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === type ? '#3b82f6' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Pending */}
      <SectionHeader title="Upcoming / Pending Visits" count={pending.length} collapsed={isPendingCollapsed} onToggle={() => setIsPendingCollapsed(!isPendingCollapsed)} />
      {!isPendingCollapsed && <div style={{ ...s.card, marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['#', 'Name', 'Type', 'City', 'Country', 'Date Range', 'Time Range', 'Status', 'Companion', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>Loading...</td></tr> :
              pending.length === 0 ? <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No pending visits</td></tr> :
              pending.map((v, i) => (
                <tr key={v.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{v.name}</td>
                  <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{v.type}</span></td>
                  <td style={s.td}>{v.city || '—'}</td>
                  <td style={s.td}>{v.country || '—'}</td>
                  <td style={s.td}>{dateRange(v)}</td>
                  <td style={s.td}>{timeRange(v)}</td>
                  <td style={s.td}><span style={{ color: v.connection_status === 'New' ? '#10b981' : '#f59e0b', fontWeight: '500' }}>{v.connection_status || 'New'}</span></td>
                  <td style={s.td}>{v.companion || '—'}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleMarkDone(v)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><CheckCircle size={13} /> Mark Done</button>
                      <button onClick={() => handleShowQR(v)} title="Show QR Code" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }}><QrCode size={14} /></button>
                      <button onClick={() => handleEdit(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                      <button onClick={() => handleCancel(v.id)} title="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}>✕</button>
                      <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>}

      {/* Completed */}
      <SectionHeader title="Completed Visits" count={completed.length} collapsed={isCompletedCollapsed} onToggle={() => setIsCompletedCollapsed(!isCompletedCollapsed)} color="#10b981" />
      {!isCompletedCollapsed && (
        <div style={{ ...s.card, opacity: 0.8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Name', 'Type', 'City', 'Date Range', 'Companion', 'Accomplished', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {completed.length === 0 ? <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No completed visits yet</td></tr> :
                completed.map((v, i) => (
                  <tr key={v.id} style={{ background: 'rgba(16,185,129,0.02)' }}>
                    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500', textDecoration: 'line-through', opacity: 0.7 }}>{v.name}</td>
                    <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{v.type}</span></td>
                    <td style={s.td}>{v.city || '—'}</td>
                    <td style={s.td}>{dateRange(v)}</td>
                    <td style={s.td}>{v.companion || '—'}</td>
                    <td style={s.td}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✓ Done</span>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completions[v.id]?.comment || ''}</p>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setReportVisit(v)} title="Edit / Generate Report" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}><FileText size={14} /></button>
                        <button onClick={() => handleUndoComplete(v.id)} title="Undo Completion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}><RotateCcw size={14} /></button>
                        <button onClick={() => handleEdit(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancelled */}
      <SectionHeader title="Cancelled Visits" count={cancelled.length} collapsed={isCancelledCollapsed} onToggle={() => setIsCancelledCollapsed(!isCancelledCollapsed)} color="#ef4444" />
      {!isCancelledCollapsed && (
        <div style={{ ...s.card, opacity: 0.7 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Name', 'Type', 'Date Range', 'Companion', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {cancelled.length === 0 ? <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No cancelled visits</td></tr> :
                cancelled.map((v, i) => (
                  <tr key={v.id} style={{ background: 'rgba(239,68,68,0.03)' }}>
                    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                    <td style={{ ...s.td, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textDecoration: 'line-through' }}>{v.name}</td>
                    <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{v.type}</span></td>
                    <td style={s.td}>{dateRange(v)}</td>
                    <td style={s.td}>{v.companion || '—'}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUncancel(v.id)} title="Restore" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '12px' }}>↩ Restore</button>
                        <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
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
        <div style={s.modal}><div style={s.modalCard}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>{editingVisit ? 'Edit Visit' : 'Add New Visit'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Visit Name *', key: 'name', type: 'text', placeholder: 'e.g. Irbid Outreach Fair 2025' },
              { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. Amman' },
              { label: 'Country', key: 'country', type: 'text', placeholder: 'e.g. Jordan' },
            ].map(f => (
              <div key={f.key}><label style={s.label}>{f.label}</label><input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={s.input} /></div>
            ))}
            <div><label style={s.label}>Type *</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={s.input}>{OUTREACH_TYPES.map(t => <option key={t} value={t} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{t}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={s.label}>Date From *</label><input type='date' value={form.date_from} onChange={e => setForm({ ...form, date_from: e.target.value })} style={s.input} /></div>
              <div><label style={s.label}>Date To *</label><input type='date' value={form.date_to} onChange={e => setForm({ ...form, date_to: e.target.value })} style={s.input} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={s.label}>Time From</label><input type='time' value={form.time_from} onChange={e => setForm({ ...form, time_from: e.target.value })} style={{ ...s.input, appearance: 'auto' }} /></div>
              <div><label style={s.label}>Time To</label><input type='time' value={form.time_to} onChange={e => setForm({ ...form, time_to: e.target.value })} style={{ ...s.input, appearance: 'auto' }} /></div>
            </div>
            <div><label style={s.label}>Companion</label><input type="text" value={form.companion} onChange={e => setForm({ ...form, companion: e.target.value })} placeholder='e.g. Aghbar' style={s.input} /></div>
            <div><label style={s.label}>Status (New/Repeated)</label><select value={form.connection_status} onChange={e => setForm({ ...form, connection_status: e.target.value })} style={s.input}><option value="New" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>New</option><option value="Repeated" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Repeated</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>{editingVisit ? 'Save Changes' : 'Add Visit'}</button>
            <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div></div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div style={s.modal}><div style={s.modalCard}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>Visit Accomplished</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>"{completingVisit?.name}"</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label style={s.label}>What did you accomplish? *</label><textarea value={completionComment} onChange={e => setCompletionComment(e.target.value)} placeholder="e.g. Set up booth, met with 50 students..." rows={4} style={{ ...s.input, resize: 'vertical' }} /></div>
            <div>
              <label style={s.label}>Attach Photos (optional)</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                {uploadingImages ? 'Uploading...' : '+ Add Photos'}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
              {completionImages.length > 0 && <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>{completionImages.map((url, i) => <img key={i} src={url} alt="upload" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />)}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={handleCompleteSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>Save</button>
            <button onClick={() => { setShowCompleteModal(false); setCompletingVisit(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div></div>
      )}

      {/* Report Modal */}
      {reportVisit && <ReportModal visit={{ ...reportVisit, report_data: completions[reportVisit.id]?.report_data || {} }} onClose={() => setReportVisit(null)} />}

      {/* QR Code Modal */}
      {showQRModal && qrVisit && (
        <div style={s.modal} onClick={() => setShowQRModal(false)}>
          <div style={{ ...s.modalCard, textAlign: 'center', maxWidth: '350px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>Visitor Registration</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px 0' }}>{qrVisit.name}</p>
            
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px' }}>
              <QRCodeSVG 
                value={getRegistrationLink(qrVisit.id)} 
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getRegistrationLink(qrVisit.id)}
              </div>
              <button 
                onClick={() => copyToClipboard(getRegistrationLink(qrVisit.id))}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#ffffff', fontSize: '11px', cursor: 'pointer' }}
              >
                {copied ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <button onClick={() => setShowQRModal(false)} style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '13px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Outreach Page ──────────────────────────────────────────
export default function OutreachPage() {
  const [tab, setTab] = useState('visits')

  const tabs = [
    { key: 'visits', label: 'Outreach Visits' },
    { key: 'budget', label: 'Budget Request' },
  ]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#0d0d12', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
              background: t.key === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: t.key === tab ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              border: t.key === tab ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'visits' && <OutreachVisitsTab />}
      {tab === 'budget' && <BudgetTab />}
    </div>
  )
}