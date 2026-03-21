'use client'
import { logActivity } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingTask, setCompletingTask] = useState(null)
  const [completionComment, setCompletionComment] = useState('')
  const [completionImages, setCompletionImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')
  const supabase = createClient()

  const emptyForm = { title: '', description: '', due_date: '' }
  const [form, setForm] = useState(emptyForm)

 const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('tasks').select('*, task_completions(*)').order('due_date', { ascending: true })
    if (!error) setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleSubmit = async () => {
    if (!form.title) { alert('Please fill in task title'); return }
    if (editingTask) {
      const { error } = await supabase.from('tasks').update(form).eq('id', editingTask.id)
      if (!error) {
        await logActivity('Edited task', 'task', form.title, 'Task details updated')
        fetchTasks(); setShowForm(false); setEditingTask(null); setForm(emptyForm)
      }
    } else {
      const { error } = await supabase.from('tasks').insert([form])
      if (!error) {
        await logActivity('Added task', 'task', form.title, 'New task created' + (form.due_date ? ' due ' + form.due_date : ''))
        fetchTasks(); setShowForm(false); setForm(emptyForm)
      }
    }
  }
  const handleEdit = (task) => {
    setEditingTask(task)
    setForm({ title: task.title || '', description: task.description || '', due_date: task.due_date || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const task = tasks.find(t => t.id === id)
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) {
      await logActivity('Deleted task', 'task', task?.title, 'Task removed')
      fetchTasks()
    }
  }

  const handleMarkDone = (task) => {
    setCompletingTask(task)
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
      const timestamp = new Date().getTime()
      const fileName = timestamp + '-' + file.name
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
    if (!completionComment) { alert('Please write what you achieved'); return }
    const { error: completionError } = await supabase.from('task_completions').insert([{ task_id: completingTask.id, comment: completionComment, images: completionImages }])
    if (!completionError) {
      await supabase.from('tasks').update({ is_done: true }).eq('id', completingTask.id)
      await logActivity('Completed task', 'task', completingTask?.title, completionComment)
      setShowCompleteModal(false)
      setCompletingTask(null)
      setCompletionComment('')
      setCompletionImages([])
      fetchTasks()
    }
  }
  const handleReopen = async (id) => {
    await supabase.from('tasks').update({ is_done: false }).eq('id', id)
    fetchTasks()
  }

  const filteredTasks = filterStatus === 'all' ? tasks : filterStatus === 'pending' ? tasks.filter(t => !t.is_done) : tasks.filter(t => t.is_done)
  const isOverdue = (task) => !task.is_done && task.due_date && new Date(task.due_date) < new Date()

  const s = {
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Tasks & Reminders</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage your daily tasks and follow-ups</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingTask(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        {['pending', 'done', 'all'].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer',
            background: filterStatus === status ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            color: filterStatus === status ? '#3b82f6' : 'rgba(255,255,255,0.4)',
          }}>
            {status === 'pending' ? 'Pending' : status === 'done' ? 'Completed' : 'All'}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: '8px' }}>{filteredTasks.length} tasks</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No tasks found</div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderLeft: '3px solid ' + (task.is_done ? '#10b981' : isOverdue(task) ? '#ef4444' : '#3b82f6'),
              borderRadius: '16px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <button onClick={() => task.is_done ? handleReopen(task.id) : handleMarkDone(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: task.is_done ? '#10b981' : 'rgba(255,255,255,0.2)', display: 'flex', marginTop: '1px' }}>
                    {task.is_done ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: task.is_done ? 'rgba(255,255,255,0.3)' : '#ffffff', margin: '0 0 4px 0', textDecoration: task.is_done ? 'line-through' : 'none' }}>{task.title}</h3>
                    {task.description && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px 0' }}>{task.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {task.due_date && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: isOverdue(task) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: isOverdue(task) ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
                          {isOverdue(task) ? '⚠ Overdue: ' : 'Due: '}{task.due_date}
                        </span>
                      )}
                      {task.is_done && task.task_completions?.length > 0 && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          ✓ {task.task_completions[0].comment}
                        </span>
                      )}
                    </div>
                    {task.is_done && task.task_completions?.[0]?.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {task.task_completions[0].images.map((url, i) => (
                          <img key={i} src={url} alt="completion" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!task.is_done && (
                    <button onClick={() => handleEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                    ><Pencil size={14} /></button>
                  )}
                  <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Visit PBS School" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Additional details..." rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </div>
              <div>
                <label style={s.label}>Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={s.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingTask(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>Mark as Done</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>"{completingTask?.title}"</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>What did you achieve? *</label>
                <textarea value={completionComment} onChange={(e) => setCompletionComment(e.target.value)} placeholder="e.g. Met with 25 students, collected 20 contacts..." rows={4} style={{ ...s.input, resize: 'vertical' }} />
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
                Mark as Done
              </button>
              <button onClick={() => { setShowCompleteModal(false); setCompletingTask(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}