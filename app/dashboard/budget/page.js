'use client'
import { useState, useEffect } from 'react'

export default function BudgetPage() {
  const [pendingVisits, setPendingVisits] = useState([])
  const [form, setForm] = useState({
    visitType: '',
    companion: '',
    date: '',
    hourFrom: '',
    hourTo: '',
    costFields: [],
    notes: '',
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
        const pending = (visits || []).filter(v =>
          !completedIds.has(v.id) &&
          !v.is_cancelled
        )
        setPendingVisits(pending)
      })
      .catch(() => {})
  }, [])

  function setField(key, val) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function addCostField() {
    setForm(p => ({ ...p, costFields: [...p.costFields, { label: '', amount: '' }] }))
  }

  function updateCostField(i, key, val) {
    setForm(p => {
      const fields = [...p.costFields]
      fields[i] = { ...fields[i], [key]: val }
      return { ...p, costFields: fields }
    })
  }

  function removeCostField(i) {
    setForm(p => ({ ...p, costFields: p.costFields.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!form.visitType || !form.date) { setError('Visit type and date are required.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', payload: { ...form, total } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedId(data.request?.id ?? null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleExport() {
    if (!form.visitType || !form.date) { setError('Fill visit type and date before exporting.'); return }
    setError('')

    if (savedId) {
      window.open(`/api/budget/export?id=${savedId}`, '_blank')
      return
    }

    const params = new URLSearchParams({
      visit_type:  form.visitType,
      companion:   form.companion,
      date:        form.date,
      hour_from:   form.hourFrom,
      hour_to:     form.hourTo,
      total:       total.toString(),
      notes:       form.notes,
      cost_fields: encodeURIComponent(JSON.stringify(form.costFields)),
    })
    window.open(`/api/budget/export?${params.toString()}`, '_blank')
  }

  const inputStyle = {
    width: '100%', background: '#12121c', border: '1px solid #23233a',
    borderRadius: '8px', padding: '9px 12px', color: '#e8e8f0',
    fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: '11px', color: '#7070a0', marginBottom: '5px', display: 'block',
    fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase',
  }
  const sectionStyle = {
    background: '#181824', border: '1px solid #ffffff0d', borderRadius: '12px',
    padding: '20px 22px', marginBottom: '14px',
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#0d0d12', fontFamily: 'system-ui, sans-serif', maxWidth: '720px' }}>

      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#e8e8f0' }}>Budget Request</div>
        <div style={{ fontSize: '12px', color: '#55556a', marginTop: '3px' }}>Outreach trip cost planner · HTU SRO CRM</div>
      </div>

      {/* Trip Details */}
      <div style={sectionStyle}>
        <div style={{ fontSize: '12px', color: '#7070a0', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '16px' }}>Trip Details</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Visit Type *</label>
            <select value={form.visitType} onChange={e => setField('visitType', e.target.value)} style={inputStyle}>
              <option value=''>Select type…</option>
              {pendingVisits.map(v => (
                <option key={v.id} value={v.type}>{v.school_name} — {v.type} ({v.visit_date || v.outreach_start_date})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Companion</label>
            <input value={form.companion} onChange={e => setField('companion', e.target.value)} placeholder='Name…' style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type='date' value={form.date} onChange={e => setField('date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hour From</label>
            <input type='time' value={form.hourFrom} onChange={e => setField('hourFrom', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hour To</label>
            <input type='time' value={form.hourTo} onChange={e => setField('hourTo', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#7070a0', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Cost Breakdown</div>
          <button onClick={addCostField} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add item
          </button>
        </div>

        {form.costFields.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#55556a', fontSize: '13px' }}>No cost items yet — click "Add item" to start</div>
        )}

        {form.costFields.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            <input
              value={f.label}
              onChange={e => updateCostField(i, 'label', e.target.value)}
              placeholder='e.g. Visa, Pocket Money, Fair Fees…'
              style={inputStyle}
            />
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7070a0', fontSize: '12px' }}>JD</span>
              <input
                type='number' min='0' step='0.01'
                value={f.amount}
                onChange={e => updateCostField(i, 'amount', e.target.value)}
                placeholder='0.00'
                style={{ ...inputStyle, paddingLeft: '30px' }}
              />
            </div>
            <button
              onClick={() => removeCostField(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '5px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f06595'}
              onMouseLeave={e => e.currentTarget.style.color = '#55556a'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}

        {form.costFields.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #ffffff0d', marginTop: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#3ecf8e' }}>
              Total: JD {total.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          placeholder='Any additional notes…'
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ color: '#f06595', fontSize: '13px', marginBottom: '14px', padding: '10px 14px', background: '#2a0f1a', border: '1px solid #4a1a2a', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 20px', borderRadius: '8px', background: saving ? '#1a2d52' : '#1a3d2a', border: `1px solid ${saving ? '#2a4a80' : '#1a5c42'}`, color: saving ? '#4f8ef7' : '#3ecf8e', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Request'}
        </button>
        <button
          onClick={handleExport}
          style={{ padding: '10px 20px', borderRadius: '8px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
          Export as PDF
        </button>
      </div>
    </div>
  )
}