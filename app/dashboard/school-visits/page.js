'use client'
import { logActivity } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, CheckCircle, Filter } from 'lucide-react'

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
  const supabase = createClient()

  const emptyForm = {
    school_name: '',
    type: 'jordan_tour',
    city: '',
    country: '',
    private_or_public: 'private',
    visit_date: '',
  }

  const [form, setForm] = useState(emptyForm)

  const fetchVisits = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('school_visits')
      .select('*')
      .order('visit_date', { ascending: false })
    if (!error) setVisits(data)
    setLoading(false)
  }

  const fetchCompletions = async () => {
    const { data, error } = await supabase.from('visit_completions').select('*')
    if (!error) {
      const map = {}
      data.forEach(c => { map[c.visit_id] = c })
      setCompletions(map)
    }
  }

  useEffect(() => {
    fetchVisits()
    fetchCompletions()
  }, [])

  const handleSubmit = async () => {
    if (!form.school_name || !form.visit_date) {
      alert('Please fill in school name and visit date')
      return
    }
    if (editingVisit) {
      const { error } = await supabase.from('school_visits').update(form).eq('id', editingVisit.id)
      if (!error) {
        await logActivity('Edited school visit', 'school_visit', form.school_name, 'Updated visit details')
        fetchVisits(); setShowForm(false); setEditingVisit(null); setForm(emptyForm)
      }
    } else {
      const { error } = await supabase.from('school_visits').insert([form])
      if (!error) {
        await logActivity('Added school visit', 'school_visit', form.school_name, 'New school visit on ' + form.visit_date)
        fetchVisits(); setShowForm(false); setForm(emptyForm)
      }
    }
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
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this visit?')) return
    const visit = visits.find(v => v.id === id)
    const { error } = await supabase.from('school_visits').delete().eq('id', id)
    if (!error) {
      await logActivity('Deleted school visit', 'school_visit', visit?.school_name, 'School visit removed')
      fetchVisits()
    }
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
      const fileName = Date.now() + '-' + file.name
      const { data, error } = await supabase.storage.from('task-images').upload(fileName, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('task-images').getPublicUrl(data.path)
        uploadedUrls.push(urlData.publicUrl)
      }
    }
    setCompletionImages(prev => [...prev, ...uploadedUrls])
    setUploadingImages(false)
  }

  const handleCompleteSubmit = async () => {
    if (!completionComment) {
      alert('Please write what you accomplished during this visit')
      return
    }
    const { error } = await supabase.from('visit_completions').insert([{
      visit_id: completingVisit.id,
      comment: completionComment,
      images: completionImages,
    }])
    if (!error) {
      await logActivity('Completed school visit', 'school_visit', completingVisit?.school_name, completionComment)
      setShowCompleteModal(false)
      setCompletingVisit(null)
      setCompletionComment('')
      setCompletionImages([])
      fetchCompletions()
    }
  }

  const filteredVisits = filterType === 'all' ? visits : visits.filter(v => v.type === filterType)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>School Visits</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage all school tours and fair visits</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingVisit(null); setForm(emptyForm) }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
        >
          <Plus size={16} />
          Add Visit
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {['all', 'jordan_tour', 'international_fair'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: filterType === type ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: filterType === type ? '#3b82f6' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}
          >
            {type === 'all' ? 'All' : type === 'jordan_tour' ? 'Jordan Tours' : 'International Fairs'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['School Name', 'Type', 'City', 'Country', 'Public/Private', 'Visit Date', 'Accomplished', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
            ) : filteredVisits.length === 0 ? (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No visits found</td></tr>
            ) : (
              filteredVisits.map((visit) => (
                <tr key={visit.id} style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{visit.school_name}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      background: visit.type === 'jordan_tour' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      color: visit.type === 'jordan_tour' ? '#60a5fa' : '#a78bfa',
                    }}>
                      {visit.type === 'jordan_tour' ? 'Jordan Tour' : 'International Fair'}
                    </span>
                  </td>
                  <td style={s.td}>{visit.city || '-'}</td>
                  <td style={s.td}>{visit.country || '-'}</td>
                  <td style={s.td}>{visit.private_or_public}</td>
                  <td style={s.td}>{visit.visit_date}</td>
                  <td style={s.td}>
                    {completions[visit.id] ? (
                      <div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✓ Done</span>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completions[visit.id].comment}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkDone(visit)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <CheckCircle size={13} />
                        Mark Done
                      </button>
                    )}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', borderRadius: '6px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      >
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', borderRadius: '6px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      >
                        <Trash2 size={14} />
                      </button>
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
              {editingVisit ? 'Edit Visit' : 'Add New Visit'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'School Name *', key: 'school_name', type: 'text', placeholder: 'e.g. Al-Ahliyya School' },
                { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. Amman' },
                { label: 'Country', key: 'country', type: 'text', placeholder: 'e.g. Jordan' },
                { label: 'Visit Date *', key: 'visit_date', type: 'date', placeholder: '' },
              ].map(field => (
                <div key={field.key}>
                  <label style={s.label}>{field.label}</label>
                  <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s.input}>
                  <option value="jordan_tour">Jordan Tour</option>
                  <option value="international_fair">International Fair</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Public or Private *</label>
                <select value={form.private_or_public} onChange={(e) => setForm({ ...form, private_or_public: e.target.value })} style={s.input}>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingVisit ? 'Save Changes' : 'Add Visit'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
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
                <textarea
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  placeholder="e.g. Met with 30 students, collected 25 contacts..."
                  rows={4}
                  style={{ ...s.input, resize: 'vertical' }}
                />
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
              <button onClick={handleCompleteSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                Save
              </button>
              <button onClick={() => { setShowCompleteModal(false); setCompletingVisit(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}