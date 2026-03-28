'use client'

import { FileText, Plus, Pencil, Trash2, CheckCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { logActivity } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function SchoolVisitsPage() {
  const supabase = createClient()

  const emptyForm = {
    school_name: '',
    type: 'School Tours',
    city: '',
    country: '',
    private_or_public: 'private',
    visit_date: '',
    visit_time: '',
    connection_status: 'New',
    reminder_time: '60', // Default 1 hour
    qstash_message_id: null,
  }

  const [visits, setVisits] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
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
  const [form, setForm] = useState(emptyForm)

  // Fetch all visits
  const fetchVisits = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('school_visits')
      .select('*')
      .order('visit_date', { ascending: true })
      .order('visit_time', { ascending: true })

    if (!error) setVisits(data)
    setLoading(false)
  }

  // Fetch completions
  const fetchCompletions = async () => {
    const { data, error } = await supabase.from('visit_completions').select('*')
    if (!error) {
      const map = {}
      data.forEach(c => { map[c.visit_id] = c })
      setCompletions(map)
    }
  }

  // Fetch students
  const fetchVisitStudents = async () => {
    const { data } = await supabase.from('visit_students').select('*')
    if (data) setVisitStudents(data)
  }

  useEffect(() => {
    fetchVisits()
    fetchCompletions()
    fetchVisitStudents()
  }, [])

  const handleSubmit = async () => {
    if (!form.school_name || !form.visit_date || !form.visit_time) {
      alert('Please fill in school name, visit date, and visit time.')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const payload = {
        ...form,
        created_by: session?.user?.id || null,
        visit_time: form.visit_time === '' ? null : form.visit_time,
      }

      let savedVisitData
      if (editingVisit) {
        const { data, error } = await supabase.from('school_visits').update(payload).eq('id', editingVisit.id).select().maybeSingle()
        if (error) throw error
        savedVisitData = data
        await logActivity('Edited school visit', 'school_visit', payload.school_name, 'Updated visit details')
      } else {
        const { data, error } = await supabase.from('school_visits').insert([payload]).select().maybeSingle()
        if (error) throw error
        savedVisitData = data
        await logActivity('Created school visit', 'school_visit', payload.school_name, 'New visit added')
      }

      // Trigger background reminder API
      if (savedVisitData?.id) {
        const res = await fetch('/api/schedule-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit_id: savedVisitData.id,
            school_name: savedVisitData.school_name,
            visit_date: savedVisitData.visit_date,
            visit_time: savedVisitData.visit_time,
            reminder: savedVisitData.reminder_time,
            old_message_id: savedVisitData.qstash_message_id
          })
        })
        const scheduleData = await res.json()
        if (scheduleData.messageId) {
          await supabase.from('school_visits').update({ qstash_message_id: scheduleData.messageId }).eq('id', savedVisitData.id)
        }
        if (scheduleData.error) alert("BACKGROUND API ERROR: " + scheduleData.error)
      }

    } catch (err) {
      console.error("Critical Error during save:", err)
      alert("Error: " + err.message)
    } finally {
      fetchVisits()
      setShowForm(false)
      setEditingVisit(null)
      setForm(emptyForm)
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
      visit_time: visit.visit_time || '',
      connection_status: visit.connection_status || 'New',
      reminder_time: visit.reminder_time || '60',
      qstash_message_id: visit.qstash_message_id || null,
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
    if (!files.length) return
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

  const handleUndoComplete = async (visitId) => {
    if (!confirm('Are you sure you want to undo this completion?')) return
    const { error } = await supabase.from('visit_completions').delete().eq('visit_id', visitId)
    if (!error) {
      await logActivity('Undid visit completion', 'school_visit', visits.find(v => v.id === visitId)?.school_name, 'Moved back to pending')
      fetchCompletions()
    } else alert('Error undoing: ' + error.message)
  }

  const filteredVisits = filterType === 'all' ? visits : visits.filter(v => v.type === filterType)
  const pendingVisits = filteredVisits.filter(v => !completions[v.id])
  const completedVisits = filteredVisits.filter(v => completions[v.id])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">School Visits</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-1"/> Add Visit
        </button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded p-1">
          <option value="all">All Types</option>
          <option value="School Tours">School Tours</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {showForm && (
        <div className="border p-4 mb-4 rounded">
          <h2 className="font-bold mb-2">{editingVisit ? 'Edit Visit' : 'Add Visit'}</h2>
          <input placeholder="School Name" value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value })} className="border p-1 mb-2 w-full"/>
          <input type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} className="border p-1 mb-2 w-full"/>
          <input type="time" value={form.visit_time} onChange={e => setForm({ ...form, visit_time: e.target.value })} className="border p-1 mb-2 w-full"/>
          <button onClick={handleSubmit} className="btn btn-success mr-2">{editingVisit ? 'Update' : 'Save'}</button>
          <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} className="btn btn-secondary">Cancel</button>
        </div>
      )}

      <h2 className="text-xl font-bold mt-4 mb-2">Pending Visits</h2>
      <table className="w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">School</th>
            <th className="border p-1">Date</th>
            <th className="border p-1">Time</th>
            <th className="border p-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingVisits.map(v => (
            <tr key={v.id}>
              <td className="border p-1">{v.school_name}</td>
              <td className="border p-1">{v.visit_date}</td>
              <td className="border p-1">{v.visit_time}</td>
              <td className="border p-1 flex gap-1">
                <button onClick={() => handleEdit(v)} className="btn btn-sm btn-info"><Pencil className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(v.id)} className="btn btn-sm btn-error"><Trash2 className="w-4 h-4"/></button>
                <button onClick={() => handleMarkDone(v)} className="btn btn-sm btn-success"><CheckCircle className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-bold mt-4 mb-2 flex items-center justify-between">
        Completed Visits
        <button onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)} className="btn btn-sm btn-secondary">
          {isCompletedCollapsed ? <ChevronDown className="w-4 h-4"/> : <ChevronUp className="w-4 h-4"/>}
        </button>
      </h2>
      {!isCompletedCollapsed && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1">School</th>
              <th className="border p-1">Date</th>
              <th className="border p-1">Comment</th>
              <th className="border p-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {completedVisits.map(v => (
              <tr key={v.id}>
                <td className="border p-1">{v.school_name}</td>
                <td className="border p-1">{v.visit_date}</td>
                <td className="border p-1">{completions[v.id]?.comment}</td>
                <td className="border p-1">
                  <button onClick={() => handleUndoComplete(v.id)} className="btn btn-sm btn-warning">Undo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded w-96">
            <h3 className="font-bold mb-2">Complete Visit: {completingVisit?.school_name}</h3>
            <textarea placeholder="What was accomplished?" value={completionComment} onChange={e => setCompletionComment(e.target.value)} className="border p-1 w-full mb-2"/>
            <input type="file" multiple onChange={handleImageUpload} className="mb-2"/>
            {uploadingImages && <p>Uploading images...</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={handleCompleteSubmit} className="btn btn-success">Submit</button>
              <button onClick={() => setShowCompleteModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}