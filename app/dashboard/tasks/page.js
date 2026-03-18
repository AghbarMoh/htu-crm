'use client'

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

  const emptyForm = {
    title: '',
    description: '',
    due_date: '',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_completions(*)')
      .order('due_date', { ascending: true })
    if (!error) setTasks(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.title) {
      alert('Please fill in task title')
      return
    }

    if (editingTask) {
      const { error } = await supabase
        .from('tasks')
        .update(form)
        .eq('id', editingTask.id)
      if (!error) {
        fetchTasks()
        setShowForm(false)
        setEditingTask(null)
        setForm(emptyForm)
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([form])
      if (!error) {
        fetchTasks()
        setShowForm(false)
        setForm(emptyForm)
      }
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (!error) fetchTasks()
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
      const fileName = Date.now() + '-' + file.name
      const { data, error } = await supabase.storage
        .from('task-images')
        .upload(fileName, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('task-images')
          .getPublicUrl(data.path)
          console.log('Image URL:', urlData.publicUrl)
        uploadedUrls.push(urlData.publicUrl)

      }
    }

    setCompletionImages(prev => [...prev, ...uploadedUrls])
    setUploadingImages(false)
  }

  const handleCompleteSubmit = async () => {
    if (!completionComment) {
      alert('Please write what you achieved in this task')
      return
    }

    const { error: completionError } = await supabase
      .from('task_completions')
      .insert([{
        task_id: completingTask.id,
        comment: completionComment,
        images: completionImages,
      }])

    if (!completionError) {
      await supabase
        .from('tasks')
        .update({ is_done: true })
        .eq('id', completingTask.id)

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

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : filterStatus === 'pending'
    ? tasks.filter(t => !t.is_done)
    : tasks.filter(t => t.is_done)

  const isOverdue = (task) => {
    if (task.is_done || !task.due_date) return false
    return new Date(task.due_date) < new Date()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks & Reminders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your daily tasks and follow-ups</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingTask(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        {['pending', 'done', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={"px-3 py-1 rounded-full text-sm font-medium transition " + (filterStatus === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}
          >
            {status === 'pending' ? 'Pending' : status === 'done' ? 'Completed' : 'All'}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">{filteredTasks.length} tasks</span>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">No tasks found</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={"bg-white rounded-xl p-4 shadow-sm border-l-4 " + (task.is_done ? 'border-green-400' : isOverdue(task) ? 'border-red-400' : 'border-blue-400')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => task.is_done ? handleReopen(task.id) : handleMarkDone(task)}
                    className={"mt-0.5 transition " + (task.is_done ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500')}
                  >
                    {task.is_done ? <CheckCircle size={22} /> : <Circle size={22} />}
                  </button>
                  <div>
                    <h3 className={"font-medium " + (task.is_done ? 'line-through text-gray-400' : 'text-gray-800')}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {task.due_date && (
                        <span className={"text-xs px-2 py-0.5 rounded-full " + (isOverdue(task) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}>
                          {isOverdue(task) ? '⚠ Overdue: ' : 'Due: '}{task.due_date}
                        </span>
                      )}
                      {task.is_done && task.task_completions?.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          ✓ {task.task_completions[0].comment}
                        </span>
                      )}
                    </div>
                    {task.is_done && task.task_completions?.[0]?.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {task.task_completions[0].images.map((url, i) => (
                          <img key={i} src={url} alt="completion" className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!task.is_done && (
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Visit PBS School"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingTask(null); setForm(emptyForm) }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Mark as Done</h2>
            <p className="text-sm text-gray-500 mb-4">"{completingTask?.title}"</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What did you achieve? *</label>
                <textarea
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Met with 25 students, collected 20 contacts..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Photos (optional)</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
                  {uploadingImages ? 'Uploading...' : '+ Add Photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {completionImages.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {completionImages.map((url, i) => (
                      <img key={i} src={url} alt="upload" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCompleteSubmit}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Mark as Done
              </button>
              <button
                onClick={() => { setShowCompleteModal(false); setCompletingTask(null) }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}