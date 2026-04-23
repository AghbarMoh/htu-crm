'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MODES = [
  {
    id: 'country',
    label: 'Country only',
    desc: 'Full study for a country — all 7 sections, no city breakdown.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
  },
  {
    id: 'country_cities',
    label: 'Country + Cities',
    desc: 'Country-level study plus individual deep-dives per city — each city mirrors all country sections.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
]

export default function NewReportPage() {
  const router = useRouter()
  const [mode, setMode] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    country: '',
    study_period_from: new Date().getFullYear(),
    study_period_to: new Date().getFullYear(),
    education_level: '',
    data_sources: '',
    prepared_by: '',
  })

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleCreate() {
    if (!mode) return alert('Please select a report mode first.')
    if (!form.country.trim()) return alert('Please enter a country name.')
    setSaving(true)
    const res = await fetch('/api/market-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', payload: { ...form, mode, status: 'draft' } }),
    })
    const data = await res.json()
    if (data.report?.id) {
      router.push(`/dashboard/market-analysis/${data.report.id}`)
    } else {
      alert('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '36px 32px', minHeight: '100vh', background: '#0d0d12', fontFamily: 'system-ui, sans-serif' }}>

      {/* back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => router.push('/dashboard/market-analysis')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#55556a', cursor: 'pointer', padding: '6px 10px', borderRadius: '7px', border: '1px solid #ffffff0d', background: 'none', fontFamily: 'inherit' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Market analysis
        </button>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '500', color: '#e8e8f0' }}>New market report</div>
          <div style={{ fontSize: '12px', color: '#55556a', marginTop: '2px' }}>Choose a mode then fill in the details</div>
        </div>
      </div>

      {/* mode picker — 2 options only */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Report mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '600px' }}>
          {MODES.map(m => (
            <div
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                background: mode === m.id ? '#1a2d52' : '#181824',
                border: `1px solid ${mode === m.id ? '#2a4a80' : '#ffffff0d'}`,
                borderRadius: '10px',
                padding: '20px 22px',
                cursor: 'pointer',
                transition: 'all .12s',
              }}
              onMouseEnter={e => { if (mode !== m.id) e.currentTarget.style.borderColor = '#2a2a36' }}
              onMouseLeave={e => { if (mode !== m.id) e.currentTarget.style.borderColor = '#ffffff0d' }}
            >
              <div style={{ color: mode === m.id ? '#4f8ef7' : '#55556a', marginBottom: '10px' }}>{m.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: mode === m.id ? '#4f8ef7' : '#e8e8f0', marginBottom: '5px' }}>{m.label}</div>
              <div style={{ fontSize: '11px', color: '#55556a', lineHeight: '1.5' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* form */}
      <div style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '22px 24px', marginBottom: '24px', maxWidth: '700px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '18px' }}>Report details</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Country / Market *</div>
            <input
              value={form.country}
              onChange={e => set('country', e.target.value)}
              placeholder="e.g. Saudi Arabia"
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Study period — from</div>
            <input
              type="number"
              value={form.study_period_from}
              onChange={e => set('study_period_from', parseInt(e.target.value))}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Study period — to</div>
            <input
              type="number"
              value={form.study_period_to}
              onChange={e => set('study_period_to', parseInt(e.target.value))}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Education level</div>
            <select
              value={form.education_level}
              onChange={e => set('education_level', e.target.value)}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: form.education_level ? '#e8e8f0' : '#2a2a36', fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="">Select…</option>
              <option value="Bachelor / Diploma / School">Bachelor / Diploma / School</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Diploma">Diploma</option>
              <option value="School">School</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Prepared by</div>
            <input
              value={form.prepared_by}
              onChange={e => set('prepared_by', e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#2a4a80'; if (!form.prepared_by) set('prepared_by', 'Students Recruitment Office') }}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
              placeholder="Students Recruitment Office"
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Data sources</div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['CRM', 'Surveys', 'Ministry', 'Competitors', 'School Visits', 'Online Resources'].map(src => {
                const active = (form.data_sources ?? '').toLowerCase().includes(src.toLowerCase())
                return (
                  <button key={src}
                    onClick={() => {
                      const parts = form.data_sources ? form.data_sources.split(' / ').map(s => s.trim()).filter(Boolean) : []
                      const idx = parts.findIndex(p => p.toLowerCase() === src.toLowerCase())
                      if (idx >= 0) parts.splice(idx, 1); else parts.push(src)
                      set('data_sources', parts.join(' / '))
                    }}
                    style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${active ? '#2a4a80' : '#ffffff0d'}`, background: active ? '#1a2d52' : 'transparent', color: active ? '#4f8ef7' : '#55556a', transition: 'all .12s' }}
                  >{src}</button>
                )
              })}
            </div>
            <input
              value={form.data_sources}
              onChange={e => set('data_sources', e.target.value)}
              placeholder="Or type custom sources…"
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>

        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', maxWidth: '700px' }}>
        <button
          onClick={() => router.push('/dashboard/market-analysis')}
          style={{ padding: '9px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid #ffffff14', color: '#9898b0', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          style={{ padding: '9px 20px', borderRadius: '8px', background: saving ? '#12121a' : '#1a2d52', border: '1px solid #2a4a80', color: saving ? '#55556a' : '#4f8ef7', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? 'Creating…' : 'Create report →'}
        </button>
      </div>

    </div>
  )
}