'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'

export default function CompanionsPage() {
  const [companions, setCompanions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCompanion, setEditingCompanion] = useState(null)

  const emptyForm = { name: '', rank: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

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
    setForm({ name: c.name || '', rank: c.rank || '', notes: c.notes || '' })
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

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', backgroundColor: '#1a1a2e', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  // Sort companions by rank (Rank 1 at the top). Anyone without a number goes to the bottom.
  const sortedCompanions = [...companions].sort((a, b) => {
    const rankA = parseInt(a.rank) || 9999;
    const rankB = parseInt(b.rank) || 9999;
    return rankA - rankB;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Companions</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage outreach companions and their details</p>
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
            <tr>{['#', 'Name', 'Rank', 'Notes', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
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
                  {c.rank ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{c.rank}</span> : '-'}
                </td>
                <td style={{ ...s.td, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '-'}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>{editingCompanion ? 'Edit Companion' : 'Add New Companion'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmad Aghbar" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Rank</label>
                <input type="text" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="e.g. Senior Officer" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>{editingCompanion ? 'Save Changes' : 'Add Companion'}</button>
              <button onClick={() => { setShowForm(false); setEditingCompanion(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}