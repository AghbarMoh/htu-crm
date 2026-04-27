'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FileText, Star, Award, ClipboardList } from 'lucide-react'

export default function CompanionsPage() {
  const [companions, setCompanions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEval, setShowEval] = useState(false)
  const [editingCompanion, setEditingCompanion] = useState(null)
  const [evaluatingCompanion, setEvaluatingCompanion] = useState(null)

  const emptyForm = { name: '' }
  const [form, setForm] = useState(emptyForm)

  const emptyEval = {
    department: '',
    role_in_tours: '',
    inside_jordan_experience: '',
    outside_jordan_experience: '',
    commitment_to_booth: 3,
    communication: 3,
    counselor_engagement: 3,
    htu_knowledge: 3,
    data_capture: 3,
    creativity: 3,
    english_language: 3,
    evaluation_notes: ''
  }
  const [evalForm, setEvalForm] = useState(emptyEval)

  useEffect(() => { fetchCompanions() }, [])

  const fetchCompanions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companions')
      const json = await res.json()
      if (json.data) setCompanions(json.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name) { alert('Please fill in companion name'); return }
    const action = editingCompanion ? 'update' : 'insert'
    const payload = editingCompanion ? { ...form, id: editingCompanion.id } : form
    const res = await fetch('/api/companions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    })
    const json = await res.json()
    if (json.success) {
      fetchCompanions()
      setShowForm(false)
      setEditingCompanion(null)
      setForm(emptyForm)
    } else {
      alert('Error: ' + json.error)
    }
  }

  const handleEdit = (c) => {
    setEditingCompanion(c)
    setForm({ name: c.name || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const c = companions.find(x => x.id === id)
    await fetch('/api/companions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id, name: c?.name } })
    })
    fetchCompanions()
  }

  const openEvaluation = (c) => {
    setEvaluatingCompanion(c)
    const existing = c.companion_evaluations?.[0]
    if (existing) {
      setEvalForm({
        department: existing.department || '',
        role_in_tours: existing.role_in_tours || '',
        inside_jordan_experience: existing.inside_jordan_experience || '',
        outside_jordan_experience: existing.outside_jordan_experience || '',
        commitment_to_booth: existing.commitment_to_booth || 3,
        communication: existing.communication || 3,
        counselor_engagement: existing.counselor_engagement || 3,
        htu_knowledge: existing.htu_knowledge || 3,
        data_capture: existing.data_capture || 3,
        creativity: existing.creativity || 3,
        english_language: existing.english_language || 3,
        evaluation_notes: existing.evaluation_notes || ''
      })
    } else {
      setEvalForm(emptyEval)
    }
    setShowEval(true)
  }

  const handleEvalSubmit = async () => {
    const res = await fetch('/api/companions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        payload: {
          companion_id: evaluatingCompanion.id,
          companion_name: evaluatingCompanion.name,
          ...evalForm
        }
      })
    })
    const json = await res.json()
    if (json.success) {
      fetchCompanions()
      setShowEval(false)
      setEvaluatingCompanion(null)
      setEvalForm(emptyEval)
    } else {
      alert('Error: ' + json.error)
    }
  }

  const getScore = (c) => {
    const e = c.companion_evaluations?.[0]
    if (!e) return null
    return e.total_score
  }

  const getReadiness = (c) => {
    const e = c.companion_evaluations?.[0]
    if (!e) return null
    return e.readiness
  }

  const readinessColor = (r) => {
    if (r === 'Very Ready') return '#10b981'
    if (r === 'Ready with Support') return '#f59e0b'
    if (r === 'Needs Training') return '#ef4444'
    return 'rgba(255,255,255,0.3)'
  }

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
    slider: { width: '100%', accentColor: '#3b82f6' },
    scoreBadge: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: color + '18', color, border: `1px solid ${color}33` })
  }

  const sortedCompanions = [...companions].sort((a, b) => {
    const scoreA = getScore(a) || 0
    const scoreB = getScore(b) || 0
    return scoreB - scoreA
  })

  const evalTotal = evalForm.commitment_to_booth + evalForm.communication + evalForm.counselor_engagement + evalForm.htu_knowledge + evalForm.data_capture + evalForm.creativity + evalForm.english_language
  const evalReadiness = evalTotal >= 28 ? 'Very Ready' : evalTotal >= 20 ? 'Ready with Support' : 'Needs Training'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Companions</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage outreach companions and evaluations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.open('/api/companions/export', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}>
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => { setShowForm(true); setEditingCompanion(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
            <Plus size={16} /> Add Companion
          </button>
        </div>
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['#', 'Name', 'Score', 'Readiness', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : sortedCompanions.length === 0 ? (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No companions yet</td></tr>
            ) : sortedCompanions.map((c, i) => (
              <tr key={c.id} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{c.name}</td>
                <td style={s.td}>
                  {getScore(c) !== null ? (
                    <span style={s.scoreBadge('#3b82f6')}><Star size={10} /> {getScore(c)}/35</span>
                  ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>}
                </td>
                <td style={s.td}>
                  {getReadiness(c) ? (
                    <span style={s.scoreBadge(readinessColor(getReadiness(c)))}>{getReadiness(c)}</span>
                  ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>}
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEvaluation(c)} title="Evaluate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><ClipboardList size={14} /></button>
                    <button onClick={() => handleEdit(c)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Companion Form Modal */}
      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>{editingCompanion ? 'Edit Companion' : 'Add New Companion'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={s.label}>Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmad Aghbar" style={s.input} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>{editingCompanion ? 'Save Changes' : 'Add Companion'}</button>
              <button onClick={() => { setShowForm(false); setEditingCompanion(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEval && evaluatingCompanion && (
        <div style={s.modal}>
          <div style={{ ...s.modalCard, maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Evaluate: {evaluatingCompanion.name}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ ...s.scoreBadge('#3b82f6'), fontSize: '13px', padding: '4px 12px' }}><Award size={12} /> {evalTotal}/35</span>
                <span style={{ ...s.scoreBadge(readinessColor(evalReadiness)), fontSize: '13px', padding: '4px 12px' }}>{evalReadiness}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={s.label}>Department</label><input type="text" value={evalForm.department} onChange={(e) => setEvalForm({ ...evalForm, department: e.target.value })} placeholder="e.g. Faculty / Instructor" style={s.input} /></div>
                <div><label style={s.label}>Role in Tours</label><input type="text" value={evalForm.role_in_tours} onChange={(e) => setEvalForm({ ...evalForm, role_in_tours: e.target.value })} placeholder="e.g. Presenter" style={s.input} /></div>
              </div>

              <div><label style={s.label}>Inside Jordan Experience</label><textarea value={evalForm.inside_jordan_experience} onChange={(e) => setEvalForm({ ...evalForm, inside_jordan_experience: e.target.value })} placeholder="Describe participation in school fairs and tours inside Jordan..." rows={2} style={{ ...s.input, resize: 'vertical' }} /></div>
              <div><label style={s.label}>Outside Jordan Experience</label><textarea value={evalForm.outside_jordan_experience} onChange={(e) => setEvalForm({ ...evalForm, outside_jordan_experience: e.target.value })} placeholder="Describe participation in fairs outside Jordan..." rows={2} style={{ ...s.input, resize: 'vertical' }} /></div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0' }}>Performance Criteria (1–5)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { key: 'commitment_to_booth', label: 'Commitment to Booth' },
                    { key: 'communication', label: 'Communication' },
                    { key: 'counselor_engagement', label: 'Counselor Engagement' },
                    { key: 'htu_knowledge', label: 'HTU Knowledge' },
                    { key: 'data_capture', label: 'Data Capture' },
                    { key: 'creativity', label: 'Creativity' },
                    { key: 'english_language', label: 'English Language' },
                  ].map(item => (
                    <div key={item.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ ...s.label, marginBottom: 0 }}>{item.label}</label>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6' }}>{evalForm[item.key]}</span>
                      </div>
                      <input
                        type="range" min={1} max={5} step={1}
                        value={evalForm[item.key]}
                        onChange={(e) => setEvalForm({ ...evalForm, [item.key]: parseInt(e.target.value) })}
                        style={s.slider}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div><label style={s.label}>Evaluation Notes</label><textarea value={evalForm.evaluation_notes} onChange={(e) => setEvalForm({ ...evalForm, evaluation_notes: e.target.value })} placeholder="Strengths, areas for improvement, recommendations..." rows={3} style={{ ...s.input, resize: 'vertical' }} /></div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleEvalSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>Save Evaluation</button>
              <button onClick={() => { setShowEval(false); setEvaluatingCompanion(null); setEvalForm(emptyEval) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}