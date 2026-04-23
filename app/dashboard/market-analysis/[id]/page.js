'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

const STATUS_STYLES = {
  draft:       { bg: '#2a2a1a', border: '#3a2400', color: '#f5a623', dot: '#f5a623', label: 'Draft'       },
  in_progress: { bg: '#1a2030', border: '#1a2d52', color: '#4f8ef7', dot: '#4f8ef7', label: 'In Progress' },
  final:       { bg: '#0e3328', border: '#1a5c42', color: '#3ecf8e', dot: '#3ecf8e', label: 'Final'       },
}

const ALL_SECTIONS = ['meta', 'market_overview', 'decision_factors', 'constraints', 'swot', 'action_plan', 'kpi_tracker']
const SECTION_LABELS = {
  meta:             'Meta / cover',
  market_overview:  'Market overview',
  decision_factors: 'Decision factors',
  constraints:      'Constraints',
  swot:             'SWOT analysis',
  action_plan:      'Action plan',
  kpi_tracker:      'KPI tracker',
}

// Default pre-filled rows
const DEFAULT_DECISION_FACTORS = [
  { factor: 'Reputation',           importance: 4, notes: '' },
  { factor: 'Program availability', importance: 4, notes: '' },
  { factor: 'Cost / Scholarships',  importance: 5, notes: '' },
  { factor: 'Employment outcomes',  importance: 4, notes: '' },
  { factor: 'Location',             importance: 3, notes: '' },
  { factor: 'Digital Experience',   importance: 3, notes: '' },
  { factor: 'Student Life',         importance: 3, notes: '' },
  { factor: 'Facilities / Labs',    importance: 3, notes: '' },
  { factor: 'Other',                importance: 2, notes: '' },
]

const DEFAULT_CONSTRAINTS = [
  { category: 'Equivalency / Accreditation', details: '', risk_level: 'M', mitigation: '' },
  { category: 'Admission Requirements',       details: '', risk_level: 'M', mitigation: '' },
  { category: 'Government / Scholarship list',details: '', risk_level: 'M', mitigation: '' },
  { category: 'Logistics',                    details: '', risk_level: 'L', mitigation: '' },
  { category: 'Budget',                       details: '', risk_level: 'M', mitigation: '' },
]

const DEFAULT_KPI_ROWS = [
  { kpi: 'Leads',                  baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Applications',           baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Enrollment',             baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Conversion Rate',        baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Satisfaction',           baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Female Ratio',           baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'Counselor Partnerships', baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
  { kpi: 'CRM Coverage',           baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' },
]

const DEFAULT_SWOT_ITEMS = { strengths: [], weaknesses: [], opportunities: [], threats: [] }

function inp(extra = {}) {
  return {
    style: {
      width: '100%', background: '#12121a', border: '1px solid #ffffff0d',
      borderRadius: '7px', padding: '9px 12px', fontSize: '13px',
      color: '#e8e8f0', fontFamily: 'inherit', outline: 'none', ...extra,
    },
    onFocus: e => e.target.style.borderColor = '#2a4a80',
    onBlur:  e => e.target.style.borderColor = '#ffffff0d',
  }
}

// ── tiny sub-components ───────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '500', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>{children}</div>
}

function Card({ children, style = {} }) {
  return <div style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '18px 20px', marginBottom: '14px', ...style }}>{children}</div>
}

function SectionHeader({ title, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#e8e8f0' }}>{title}</div>
        {desc && <div style={{ fontSize: '12px', color: '#55556a', marginTop: '3px', maxWidth: '440px', lineHeight: '1.5' }}>{desc}</div>}
      </div>
      {action}
    </div>
  )
}

function AddRowBtn({ onClick, label = 'Add row' }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'transparent', border: '1px solid #ffffff0d', color: '#55556a', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f8ef7'; e.currentTarget.style.color = '#4f8ef7' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ffffff0d'; e.currentTarget.style.color = '#55556a' }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      {label}
    </button>
  )
}

function DeleteRowBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556a', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.color = '#f06595'}
      onMouseLeave={e => e.currentTarget.style.color = '#55556a'}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
    </button>
  )
}

function MiniInput({ value, onChange, placeholder = '', center = false, style = {}, dir }) {
  return (
    <input
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      style={{ background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '6px', padding: '6px 9px', fontSize: '12px', color: '#9898b0', fontFamily: 'inherit', outline: 'none', width: '100%', textAlign: center ? 'center' : 'left', ...style }}
      onFocus={e => e.target.style.borderColor = '#2a4a80'}
      onBlur={e => e.target.style.borderColor = '#ffffff0d'}
    />
  )
}

function MiniTextarea({ value, onChange, placeholder = '', rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '6px', padding: '6px 9px', fontSize: '12px', color: '#9898b0', fontFamily: 'inherit', outline: 'none', width: '100%', resize: 'vertical', lineHeight: '1.5' }}
      onFocus={e => e.target.style.borderColor = '#2a4a80'}
      onBlur={e => e.target.style.borderColor = '#ffffff0d'}
    />
  )
}

// ── SECTION EDITORS ───────────────────────────────────────────────────────────

function MetaSection({ report, onUpdateReport }) {
  const [preparedByFocused, setPreparedByFocused] = useState(false)

  return (
    <>
      <SectionHeader title="Meta / Cover" desc="Basic information about this market study." />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Country / Market</FieldLabel>
            <input value={report.country ?? ''} onChange={e => onUpdateReport('country', e.target.value)} {...inp()} />
          </div>
          <div>
            <FieldLabel>Study period — from</FieldLabel>
            <input type="number" value={report.study_period_from ?? ''} onChange={e => onUpdateReport('study_period_from', parseInt(e.target.value))} {...inp()} />
          </div>
          <div>
            <FieldLabel>Study period — to</FieldLabel>
            <input type="number" value={report.study_period_to ?? ''} onChange={e => onUpdateReport('study_period_to', parseInt(e.target.value))} {...inp()} />
          </div>
          <div>
            <FieldLabel>Education level</FieldLabel>
            <select value={report.education_level ?? ''} onChange={e => onUpdateReport('education_level', e.target.value)}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Select…</option>
              <option>Bachelor / Diploma / School</option>
              <option>Bachelor</option>
              <option>Diploma</option>
              <option>School</option>
              <option>Postgraduate</option>
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <FieldLabel>Prepared by</FieldLabel>
            <input
              value={report.prepared_by ?? ''}
              onChange={e => onUpdateReport('prepared_by', e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#2a4a80'; setPreparedByFocused(true) }}
              onBlur={e => { e.target.style.borderColor = '#ffffff0d'; setTimeout(() => setPreparedByFocused(false), 150) }}
              placeholder="Students Recruitment Office"
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
            />
            {preparedByFocused && !report.prepared_by && (
              <div
                onClick={() => onUpdateReport('prepared_by', 'Students Recruitment Office')}
                style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '2px', background: '#1e1e2e', border: '1px solid #2a4a80', borderRadius: '7px', padding: '8px 12px', fontSize: '13px', color: '#9898b0', cursor: 'pointer', zIndex: 10 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a2d52'; e.currentTarget.style.color = '#4f8ef7' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1e1e2e'; e.currentTarget.style.color = '#9898b0' }}
              >
                Students Recruitment Office
              </div>
            )}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Data sources</FieldLabel>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['CRM', 'Surveys', 'Ministry', 'Competitors', 'School Visits', 'Online Resources'].map(src => {
                const current = report.data_sources ?? ''
                const active = current.toLowerCase().includes(src.toLowerCase())
                return (
                  <button
                    key={src}
                    onClick={() => {
                      const parts = current ? current.split(' / ').map(s => s.trim()).filter(Boolean) : []
                      const idx = parts.findIndex(p => p.toLowerCase() === src.toLowerCase())
                      if (idx >= 0) parts.splice(idx, 1)
                      else parts.push(src)
                      onUpdateReport('data_sources', parts.join(' / '))
                    }}
                    style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${active ? '#2a4a80' : '#ffffff0d'}`, background: active ? '#1a2d52' : 'transparent', color: active ? '#4f8ef7' : '#55556a', transition: 'all .12s' }}
                  >
                    {src}
                  </button>
                )
              })}
            </div>
            <input value={report.data_sources ?? ''} onChange={e => onUpdateReport('data_sources', e.target.value)}
              placeholder="Or type custom sources…"
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={report.status ?? 'draft'} onChange={e => onUpdateReport('status', e.target.value)}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="final">Final</option>
            </select>
          </div>
        </div>
      </Card>
    </>
  )
}

function MarketOverviewSection({ content, onChange }) {
  const c = content ?? {}
  const set = (k, v) => onChange({ ...c, [k]: v })
  return (
    <>
      <SectionHeader title="Market Overview" desc="Key metrics and macro trends for this market." />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            ['total_graduates',   'Total target graduates / year'],
            ['interested_abroad', 'Estimated interested in studying abroad'],
            ['interested_stem',   'Estimated interested in STEM / technical programs'],
          ].map(([key, label]) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <textarea value={c[key] ?? ''} onChange={e => set(key, e.target.value)} rows={2}
                style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: '1.6' }}
                onFocus={e => e.target.style.borderColor = '#2a4a80'}
                onBlur={e => e.target.style.borderColor = '#ffffff0d'}
              />
            </div>
          ))}
          <div>
            <FieldLabel>Key macro trends</FieldLabel>
            <textarea value={c.key_trends ?? ''} onChange={e => set('key_trends', e.target.value)} rows={4}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: '1.6' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea value={c.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3}
              style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: '1.6' }}
              onFocus={e => e.target.style.borderColor = '#2a4a80'}
              onBlur={e => e.target.style.borderColor = '#ffffff0d'}
            />
          </div>
        </div>
      </Card>
    </>
  )
}

function DecisionFactorsSection({ content, onChange }) {
  const rows = content?.rows ?? DEFAULT_DECISION_FACTORS
  const setRows = r => onChange({ ...content, rows: r })
  const addRow = () => setRows([...rows, { factor: '', importance: 3, notes: '' }])
  const del = i => setRows(rows.filter((_, j) => j !== i))
  const set = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; setRows(r) }

  useEffect(() => {
    if (!content?.rows) onChange({ ...content, rows: DEFAULT_DECISION_FACTORS })
  }, [])

  return (
    <>
      <SectionHeader title="Decision Factors" desc="What drives students in this market to choose a university."
        action={<AddRowBtn onClick={addRow} />} />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '190px 90px 1fr 32px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #ffffff0d', marginBottom: '6px' }}>
          {['Factor', 'Importance (1–5)', 'Notes / Evidence', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '190px 90px 1fr 32px', gap: '8px', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #ffffff0d', alignItems: 'start' }}>
            <MiniInput value={r.factor} onChange={v => set(i, 'factor', v)} placeholder="e.g. Cost" />
            <select value={r.importance ?? 3} onChange={e => set(i, 'importance', parseInt(e.target.value))}
              style={{ background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '6px', padding: '6px 9px', fontSize: '12px', color: '#9898b0', fontFamily: 'inherit', outline: 'none', width: '100%', textAlign: 'center' }}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <MiniTextarea value={r.notes} onChange={v => set(i, 'notes', v)} placeholder="Evidence or context…" rows={2} />
            <DeleteRowBtn onClick={() => del(i)} />
          </div>
        ))}
      </Card>
    </>
  )
}

function ConstraintsSection({ content, onChange }) {
  const rows = content?.rows ?? DEFAULT_CONSTRAINTS
  const setRows = r => onChange({ ...content, rows: r })
  const addRow = () => setRows([...rows, { category: '', details: '', risk_level: 'M', mitigation: '' }])
  const del = i => setRows(rows.filter((_, j) => j !== i))
  const set = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; setRows(r) }

  useEffect(() => {
    if (!content?.rows) onChange({ ...content, rows: DEFAULT_CONSTRAINTS })
  }, [])

  const riskColor = { H: '#f06595', M: '#f5a623', L: '#3ecf8e' }

  return (
    <>
      <SectionHeader title="Constraints" desc="Legal, logistic, and budget barriers that affect recruitment from this market."
        action={<AddRowBtn onClick={addRow} />} />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px 1fr 32px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #ffffff0d', marginBottom: '6px' }}>
          {['Category', 'Details', 'Risk', 'Mitigation', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px 1fr 32px', gap: '8px', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #ffffff0d', alignItems: 'start' }}>
            <MiniInput value={r.category} onChange={v => set(i, 'category', v)} placeholder="e.g. Equivalency" />
            <MiniTextarea value={r.details} onChange={v => set(i, 'details', v)} placeholder="Describe the constraint…" />
            <select value={r.risk_level ?? 'M'} onChange={e => set(i, 'risk_level', e.target.value)}
              style={{ background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '6px', padding: '6px 9px', fontSize: '12px', color: riskColor[r.risk_level] ?? '#9898b0', fontFamily: 'inherit', outline: 'none', width: '100%', textAlign: 'center', fontWeight: '600' }}>
              <option value="H">H</option>
              <option value="M">M</option>
              <option value="L">L</option>
            </select>
            <MiniTextarea value={r.mitigation} onChange={v => set(i, 'mitigation', v)} placeholder="How to mitigate…" />
            <DeleteRowBtn onClick={() => del(i)} />
          </div>
        ))}
      </Card>
    </>
  )
}

// SWOT with structured bullet-point items per quadrant
function SwotSection({ content, onChange }) {
  const c = content ?? {}
  const quadrants = [
    { key: 'strengths',     label: 'Strengths',     bg: '#0e2e1e', border: '#1a5c42', headColor: '#3ecf8e', placeholder: 'Add a strength…' },
    { key: 'weaknesses',    label: 'Weaknesses',    bg: '#2e1414', border: '#5c1a1a', headColor: '#f06595', placeholder: 'Add a weakness…' },
    { key: 'opportunities', label: 'Opportunities', bg: '#12121a', border: '#1a2d52', headColor: '#4f8ef7', placeholder: 'Add an opportunity…' },
    { key: 'threats',       label: 'Threats',       bg: '#2a2000', border: '#3a3000', headColor: '#f5a623', placeholder: 'Add a threat…' },
  ]

  // items are arrays of strings
  const getItems = key => {
    const val = c[key]
    if (Array.isArray(val)) return val
    if (typeof val === 'string' && val) return val.split('\n').filter(Boolean)
    return []
  }
  const setItems = (key, items) => onChange({ ...c, [key]: items })
  const addItem = key => setItems(key, [...getItems(key), ''])
  const delItem = (key, i) => setItems(key, getItems(key).filter((_, j) => j !== i))
  const setItem = (key, i, v) => { const arr = [...getItems(key)]; arr[i] = v; setItems(key, arr) }

  return (
    <>
      <SectionHeader title="SWOT Analysis" desc="Add structured points per quadrant. Use the + button to add items." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {quadrants.map(q => {
          const items = getItems(q.key)
          return (
            <div key={q.key} style={{ background: q.bg, border: `1px solid ${q.border}`, borderRadius: '9px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: q.headColor }}>{q.label}</div>
                <button onClick={() => addItem(q.key)}
                  style={{ background: 'none', border: `1px solid ${q.border}`, borderRadius: '5px', color: q.headColor, cursor: 'pointer', padding: '2px 7px', fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>+</button>
              </div>
              {items.length === 0 && (
                <div style={{ fontSize: '11px', color: '#55556a', fontStyle: 'italic' }}>No items yet — click + to add.</div>
              )}
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ color: q.headColor, fontSize: '13px', marginTop: '5px', flexShrink: 0 }}>•</span>
                  <input
                    value={item}
                    onChange={e => setItem(q.key, i, e.target.value)}
                    placeholder={q.placeholder}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid transparent', borderRadius: '5px', padding: '4px 8px', fontSize: '12px', color: '#c8c8e0', fontFamily: 'inherit', outline: 'none', lineHeight: '1.5' }}
                    onFocus={e => e.target.style.borderColor = q.border}
                    onBlur={e => e.target.style.borderColor = 'transparent'}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addItem(q.key) }
                      if (e.key === 'Backspace' && !item) delItem(q.key, i)
                    }}
                  />
                  <button onClick={() => delItem(q.key, i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556a', padding: '4px', flexShrink: 0, marginTop: '2px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f06595'}
                    onMouseLeave={e => e.currentTarget.style.color = '#55556a'}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function ActionPlanSection({ content, onChange }) {
  const rows = content?.rows ?? []
  const setRows = r => onChange({ ...content, rows: r })
  const addRow = () => setRows([...rows, { initiative: '', description: '', owner: '', start_date: '', end_date: '', kpi: '', status: 'Planned', notes: '' }])
  const del = i => setRows(rows.filter((_, j) => j !== i))
  const set = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; setRows(r) }

  return (
    <>
      <SectionHeader title="Action Plan" desc="Initiatives, owners, timelines and status for this market."
        action={<AddRowBtn onClick={addRow} />} />
      {rows.length === 0 && (
        <Card><div style={{ fontSize: '12px', color: '#55556a' }}>No initiatives yet — click "Add row".</div></Card>
      )}
      {rows.map((r, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#55556a' }}>Initiative {i + 1}</div>
            <DeleteRowBtn onClick={() => del(i)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Initiative</FieldLabel>
              <MiniInput value={r.initiative} onChange={v => set(i, 'initiative', v)} placeholder="e.g. School Tours" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Description</FieldLabel>
              <MiniTextarea value={r.description} onChange={v => set(i, 'description', v)} placeholder="What does this initiative involve?" />
            </div>
            <div><FieldLabel>Owner</FieldLabel><MiniInput value={r.owner} onChange={v => set(i, 'owner', v)} placeholder="e.g. Dalia" /></div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={r.status ?? 'Planned'} onChange={e => set(i, 'status', e.target.value)}
                style={{ width: '100%', background: '#12121a', border: '1px solid #ffffff0d', borderRadius: '6px', padding: '6px 9px', fontSize: '12px', color: '#9898b0', fontFamily: 'inherit', outline: 'none' }}>
                <option>Planned</option><option>In Progress</option><option>Done</option><option>On Hold</option>
              </select>
            </div>
            <div><FieldLabel>Start date</FieldLabel><MiniInput value={r.start_date} onChange={v => set(i, 'start_date', v)} placeholder="e.g. Jan 2026" /></div>
            <div><FieldLabel>End date</FieldLabel><MiniInput value={r.end_date} onChange={v => set(i, 'end_date', v)} placeholder="e.g. Mar 2026" /></div>
            <div style={{ gridColumn: '1 / -1' }}><FieldLabel>KPI</FieldLabel><MiniInput value={r.kpi} onChange={v => set(i, 'kpi', v)} placeholder="e.g. School Counselors Networking" /></div>
            <div style={{ gridColumn: '1 / -1' }}><FieldLabel>Notes</FieldLabel><MiniTextarea value={r.notes} onChange={v => set(i, 'notes', v)} placeholder="Any additional context…" rows={2} /></div>
          </div>
        </Card>
      ))}
    </>
  )
}

function KpiTrackerSection({ content, onChange }) {
  const rows = content?.rows ?? DEFAULT_KPI_ROWS
  const updateLog = content?.update_log ?? []
  const setRows = r => onChange({ ...content, rows: r })
  const setLog = l => onChange({ ...content, update_log: l })
  const addRow = () => setRows([...rows, { kpi: '', baseline_year: '', baseline_value: '', target_year: '', target_value: '', current_value: '', frequency: '', source: '' }])
  const del = i => setRows(rows.filter((_, j) => j !== i))
  const set = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; setRows(r) }

  useEffect(() => {
    if (!content?.rows) onChange({ ...content, rows: DEFAULT_KPI_ROWS, update_log: [] })
  }, [])

  const addLogEntry = () => setLog([...updateLog, {
    date: new Date().toISOString().slice(0, 10),
    what_updated: '',
    data_source: '',
    updated_by: '',
    notes: '',
  }])
  const delLog = i => setLog(updateLog.filter((_, j) => j !== i))
  const setLog_ = (i, k, v) => { const l = [...updateLog]; l[i] = { ...l[i], [k]: v }; setLog(l) }

  const pct = (cur, tgt) => {
    const c = parseFloat(cur), t = parseFloat(tgt)
    if (!t || isNaN(c) || isNaN(t)) return null
    return Math.min(100, Math.round((c / t) * 100))
  }

  return (
    <>
      <SectionHeader title="KPI Tracker" desc="Baseline, targets, and current values for this market."
        action={<AddRowBtn onClick={addRow} />} />

      {/* KPI table */}
      <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
        <div style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '18px 20px', minWidth: '900px' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 90px 100px 90px 100px 110px 110px 110px 32px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #ffffff0d', marginBottom: '6px' }}>
            {['KPI', 'Baseline Yr', 'Baseline Val', 'Target Yr', 'Target Val', 'Current Val', 'Progress', 'Freq / Source', ''].map((h, i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>
          {rows.map((r, i) => {
            const p = pct(r.current_value, r.target_value)
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 90px 100px 90px 100px 110px 110px 110px 32px', gap: '8px', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #ffffff0d', alignItems: 'center' }}>
                <MiniInput value={r.kpi} onChange={v => set(i, 'kpi', v)} placeholder="e.g. Leads" />
                <MiniInput value={r.baseline_year} onChange={v => set(i, 'baseline_year', v)} placeholder="2024" center />
                <MiniInput value={r.baseline_value} onChange={v => set(i, 'baseline_value', v)} placeholder="0" center />
                <MiniInput value={r.target_year} onChange={v => set(i, 'target_year', v)} placeholder="2025" center />
                <MiniInput value={r.target_value} onChange={v => set(i, 'target_value', v)} placeholder="0" center />
                <MiniInput value={r.current_value} onChange={v => set(i, 'current_value', v)} placeholder="0" center />
                <div>
                  {p !== null ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#55556a', marginBottom: '4px' }}>
                        <span>{r.current_value} / {r.target_value}</span><span>{p}%</span>
                      </div>
                      <div style={{ height: '3px', background: '#1f1f2e', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${p}%`, borderRadius: '2px', background: p >= 80 ? '#3ecf8e' : p >= 40 ? '#4f8ef7' : '#f5a623' }} />
                      </div>
                    </>
                  ) : <div style={{ fontSize: '11px', color: '#2a2a36' }}>—</div>}
                </div>
                <MiniInput value={r.frequency || r.source} onChange={v => set(i, 'frequency', v)} placeholder="Monthly / CRM" />
                <DeleteRowBtn onClick={() => del(i)} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Update Log */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#e8e8f0' }}>Update Log</div>
            <div style={{ fontSize: '12px', color: '#55556a', marginTop: '2px' }}>Track every time this KPI data was updated.</div>
          </div>
          <AddRowBtn onClick={addLogEntry} label="Log update" />
        </div>
        <div style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 130px 1fr 32px', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #ffffff0d', marginBottom: '6px' }}>
            {['Date', 'What Updated', 'Data Source', 'Updated By', 'Notes', ''].map((h, i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>
          {updateLog.length === 0 && <div style={{ fontSize: '12px', color: '#55556a', padding: '10px 0' }}>No updates logged yet.</div>}
          {updateLog.map((entry, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 130px 1fr 32px', gap: '8px', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #ffffff0d', alignItems: 'start' }}>
              <MiniInput value={entry.date} onChange={v => setLog_(i, 'date', v)} placeholder="YYYY-MM-DD" />
              <MiniInput value={entry.what_updated} onChange={v => setLog_(i, 'what_updated', v)} placeholder="e.g. Updated Leads count" />
              <MiniInput value={entry.data_source} onChange={v => setLog_(i, 'data_source', v)} placeholder="CRM / Survey" />
              <MiniInput value={entry.updated_by} onChange={v => setLog_(i, 'updated_by', v)} placeholder="e.g. Dalia" />
              <MiniTextarea value={entry.notes} onChange={v => setLog_(i, 'notes', v)} placeholder="Any notes…" rows={1} />
              <DeleteRowBtn onClick={() => delLog(i)} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// City editor — mirrors all country sections
function CityEditor({ city, onSave, onDelete }) {
  const [name, setName] = useState(city.city_name ?? '')
  const [activeCitySection, setActiveCitySection] = useState('market_overview')
  const [citySections, setCitySections] = useState(city.content?.sections ?? {})
  const [notes, setNotes] = useState(city.content?.notes ?? '')

  const CITY_SECTION_LABELS = {
    market_overview:  'Market overview',
    decision_factors: 'Decision factors',
    constraints:      'Constraints',
    swot:             'SWOT analysis',
    action_plan:      'Action plan',
    kpi_tracker:      'KPI tracker',
  }
  const CITY_SECTIONS = Object.keys(CITY_SECTION_LABELS)

  const handleSave = () => onSave(city.id, name, { notes, sections: citySections })

  return (
    <div>
      <SectionHeader
        title={`City: ${city.city_name}`}
        desc="City-level deep dive — same sections as country level."
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSave}
              style={{ padding: '7px 14px', borderRadius: '7px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Save city
            </button>
            <button onClick={() => onDelete(city.id, city.city_name)}
              style={{ padding: '7px 14px', borderRadius: '7px', background: 'transparent', border: '1px solid #ffffff0d', color: '#f06595', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Remove
            </button>
          </div>
        }
      />

      {/* City name */}
      <Card style={{ marginBottom: '16px' }}>
        <FieldLabel>City name</FieldLabel>
        <input value={name} onChange={e => setName(e.target.value)} {...inp({ marginBottom: '0' })} />
      </Card>

      {/* mini tabs for city sections */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {CITY_SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveCitySection(s)}
            style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${activeCitySection === s ? '#2a4a80' : '#ffffff0d'}`, background: activeCitySection === s ? '#1a2d52' : 'transparent', color: activeCitySection === s ? '#4f8ef7' : '#55556a', transition: 'all .12s' }}>
            {CITY_SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* render the active city section */}
      {activeCitySection === 'market_overview' && (
        <MarketOverviewSection content={citySections.market_overview} onChange={c => setCitySections(s => ({ ...s, market_overview: c }))} />
      )}
      {activeCitySection === 'decision_factors' && (
        <DecisionFactorsSection content={citySections.decision_factors} onChange={c => setCitySections(s => ({ ...s, decision_factors: c }))} />
      )}
      {activeCitySection === 'constraints' && (
        <ConstraintsSection content={citySections.constraints} onChange={c => setCitySections(s => ({ ...s, constraints: c }))} />
      )}
      {activeCitySection === 'swot' && (
        <SwotSection content={citySections.swot} onChange={c => setCitySections(s => ({ ...s, swot: c }))} />
      )}
      {activeCitySection === 'action_plan' && (
        <ActionPlanSection content={citySections.action_plan} onChange={c => setCitySections(s => ({ ...s, action_plan: c }))} />
      )}
      {activeCitySection === 'kpi_tracker' && (
        <KpiTrackerSection content={citySections.kpi_tracker} onChange={c => setCitySections(s => ({ ...s, kpi_tracker: c }))} />
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function ReportEditorPage() {
  const router = useRouter()
  const { id } = useParams()

  const [report, setReport]     = useState(null)
  const [sections, setSections] = useState({})
  const [cities, setCities]     = useState([])
  const [activeSection, setActiveSection] = useState('meta')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [addingCity, setAddingCity] = useState(false)
  const [newCityName, setNewCityName] = useState('')

  useEffect(() => {
    fetch(`/api/market-analysis/${id}`)
      .then(r => r.json())
      .then(d => {
        setReport(d.report)
        const map = {}
        for (const s of d.sections ?? []) map[s.section_type] = s.content
        setSections(map)
        setCities(d.cities ?? [])
        setLoading(false)
      })
  }, [id])

  // city_only removed — all reports show full sections
  const visibleSections = ALL_SECTIONS

  async function saveReport() {
    await fetch('/api/market-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', payload: { ...report } }),
    })
  }

  async function saveSection(sectionType, content) {
    await fetch(`/api/market-analysis/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_section', payload: { section_type: sectionType, content } }),
    })
  }

  async function handleSaveAll() {
    setSaving(true)
    await saveReport()
    await Promise.all(
      Object.entries(sections).map(([type, content]) => saveSection(type, content))
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleAddCity() {
    if (!newCityName.trim()) return
    const res = await fetch(`/api/market-analysis/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_city', payload: { city_name: newCityName.trim(), content: {} } }),
    })
    const data = await res.json()
    if (data.city) {
      setCities(prev => [...prev, data.city])
      setActiveSection(`city_${data.city.id}`)
    }
    setNewCityName('')
    setAddingCity(false)
  }

  async function handleSaveCity(cityId, cityName, content) {
    await fetch(`/api/market-analysis/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_city', payload: { city_id: cityId, city_name: cityName, content } }),
    })
    setCities(prev => prev.map(c => c.id === cityId ? { ...c, city_name: cityName, content } : c))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDeleteCity(cityId, cityName) {
    if (!confirm(`Remove ${cityName} from this report?`)) return
    await fetch(`/api/market-analysis/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_city', payload: { city_id: cityId, city_name: cityName } }),
    })
    setCities(prev => prev.filter(c => c.id !== cityId))
    setActiveSection('meta')
  }

  function handleExport() {
    window.open(`/api/market-analysis/export?id=${id}`, '_blank')
  }

  if (loading) {
    return (
      <div style={{ background: '#0d0d12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ color: '#55556a', fontSize: '13px' }}>Loading report…</div>
      </div>
    )
  }

  const st = STATUS_STYLES[report?.status] ?? STATUS_STYLES.draft

  return (
    <div style={{ background: '#0d0d12', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* topbar */}
      <div style={{ background: '#12121a', borderBottom: '1px solid #ffffff0d', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard/market-analysis')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#55556a', cursor: 'pointer', padding: '6px 10px', borderRadius: '7px', border: '1px solid #ffffff0d', background: 'none', fontFamily: 'inherit' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Market analysis
          </button>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#e8e8f0' }}>{report?.country} — {report?.study_period_from} Market Study</div>
            <div style={{ fontSize: '12px', color: '#55556a', marginTop: '1px' }}>
              Last updated {report?.last_updated ? new Date(report.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {report?.prepared_by ?? '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
            <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={st.dot}/></svg>
            {st.label}
          </span>
          <button onClick={handleSaveAll} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid #ffffff14', color: saved ? '#3ecf8e' : '#9898b0', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save draft'}
          </button>
          <button onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: '#0e3328', border: '1px solid #1a5c42', color: '#3ecf8e', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export HTML
          </button>
        </div>
      </div>

      {/* body */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* sidebar nav */}
        <nav style={{ width: '210px', background: '#12121a', borderRight: '1px solid #ffffff0d', padding: '16px 10px', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', letterSpacing: '0.7px', textTransform: 'uppercase', padding: '0 8px', marginBottom: '6px' }}>Report sections</div>
          {visibleSections.map((s, idx) => (
            <div key={s} onClick={() => setActiveSection(s)}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', marginBottom: '2px', cursor: 'pointer', border: `1px solid ${activeSection === s ? '#2a4a80' : 'transparent'}`, background: activeSection === s ? '#1a2d52' : 'transparent', fontSize: '12px', color: activeSection === s ? '#4f8ef7' : sections[s] ? '#9898b0' : '#55556a', fontWeight: activeSection === s ? '500' : '400', transition: 'all .12s' }}
              onMouseEnter={e => { if (activeSection !== s) e.currentTarget.style.background = '#181824' }}
              onMouseLeave={e => { if (activeSection !== s) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: activeSection === s ? '#4f8ef7' : sections[s] ? '#3ecf8e' : '#2a2a36' }} />
              {SECTION_LABELS[s]}
              <span style={{ fontSize: '10px', color: '#55556a', marginLeft: 'auto' }}>{idx + 1}</span>
            </div>
          ))}

          {/* cities — only for country_cities mode */}
          {report?.mode === 'country_cities' && (
            <>
              <div style={{ height: '12px', borderBottom: '1px solid #ffffff0d', marginBottom: '12px' }} />
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#55556a', letterSpacing: '0.7px', textTransform: 'uppercase', padding: '0 8px', marginBottom: '6px' }}>Cities</div>
              {cities.map(c => (
                <div key={c.id} onClick={() => setActiveSection(`city_${c.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', marginBottom: '2px', cursor: 'pointer', border: `1px solid ${activeSection === `city_${c.id}` ? '#2a4a80' : 'transparent'}`, background: activeSection === `city_${c.id}` ? '#1a2d52' : 'transparent', fontSize: '12px', color: activeSection === `city_${c.id}` ? '#4f8ef7' : '#9898b0', transition: 'all .12s' }}
                  onMouseEnter={e => { if (activeSection !== `city_${c.id}`) e.currentTarget.style.background = '#181824' }}
                  onMouseLeave={e => { if (activeSection !== `city_${c.id}`) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a2a36', flexShrink: 0 }} />
                  {c.city_name}
                </div>
              ))}

              {addingCity ? (
                <div style={{ padding: '6px 8px' }}>
                  <input value={newCityName} onChange={e => setNewCityName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCity(); if (e.key === 'Escape') { setAddingCity(false); setNewCityName('') } }}
                    placeholder="City name…" autoFocus
                    style={{ width: '100%', background: '#12121a', border: '1px solid #2a4a80', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', color: '#e8e8f0', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button onClick={handleAddCity} style={{ flex: 1, padding: '5px', borderRadius: '5px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                    <button onClick={() => { setAddingCity(false); setNewCityName('') }} style={{ flex: 1, padding: '5px', borderRadius: '5px', background: 'transparent', border: '1px solid #ffffff0d', color: '#55556a', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingCity(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', padding: '7px 10px', borderRadius: '6px', background: 'transparent', border: '1px dashed #2a2a36', fontSize: '12px', color: '#55556a', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f8ef7'; e.currentTarget.style.color = '#4f8ef7' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a36'; e.currentTarget.style.color = '#55556a' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add city
                </button>
              )}
            </>
          )}
        </nav>

        {/* content area */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {activeSection === 'meta' && (
            <MetaSection report={report} onUpdateReport={(k, v) => setReport(r => ({ ...r, [k]: v }))} />
          )}
          {activeSection === 'market_overview' && (
            <MarketOverviewSection content={sections.market_overview} onChange={c => setSections(s => ({ ...s, market_overview: c }))} />
          )}
          {activeSection === 'decision_factors' && (
            <DecisionFactorsSection content={sections.decision_factors} onChange={c => setSections(s => ({ ...s, decision_factors: c }))} />
          )}
          {activeSection === 'constraints' && (
            <ConstraintsSection content={sections.constraints} onChange={c => setSections(s => ({ ...s, constraints: c }))} />
          )}
          {activeSection === 'swot' && (
            <SwotSection content={sections.swot} onChange={c => setSections(s => ({ ...s, swot: c }))} />
          )}
          {activeSection === 'action_plan' && (
            <ActionPlanSection content={sections.action_plan} onChange={c => setSections(s => ({ ...s, action_plan: c }))} />
          )}
          {activeSection === 'kpi_tracker' && (
            <KpiTrackerSection content={sections.kpi_tracker} onChange={c => setSections(s => ({ ...s, kpi_tracker: c }))} />
          )}
          {activeSection.startsWith('city_') && (() => {
            const cityId = activeSection.replace('city_', '')
            const city = cities.find(c => c.id === cityId)
            if (!city) return null
            return <CityEditor key={city.id} city={city} onSave={handleSaveCity} onDelete={handleDeleteCity} />
          })()}
        </div>
      </div>
    </div>
  )
}