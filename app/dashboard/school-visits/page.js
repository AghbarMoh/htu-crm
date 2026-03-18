'use client'

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

  useEffect(() => {
    fetchVisits()
    fetchCompletions()
  }, [])

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
    const { data, error } = await supabase
      .from('visit_completions')
      .select('*')
    if (!error) {
      const map = {}
      data.forEach(c => { map[c.visit_id] = c })
      setCompletions(map)
    }
  }

  const handleSubmit = async () => {
    if (!form.school_name || !form.visit_date) {
      alert('Please fill in school name and visit date')
      return
    }

    if (editingVisit) {
      const { error } = await supabase
        .from('school_visits')
        .update(form)
        .eq('id', editingVisit.id)
      if (!error) {
        fetchVisits()
        setShowForm(false)
        setEditingVisit(null)
        setForm(emptyForm)
      }
    } else {
      const { error } = await supabase
        .from('school_visits')
        .insert([form])
      if (!error) {
        fetchVisits()
        setShowForm(false)
        setForm(emptyForm)
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
    const { error } = await supabase
      .from('school_visits')
      .delete()
      .eq('id', id)
    if (!error) fetchVisits()
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
      alert('Please write what you accomplished during this visit')
      return
    }

    const { error } = await supabase
      .from('visit_completions')
      .insert([{
        visit_id: completingVisit.id,
        comment: completionComment,
        images: completionImages,
      }])

    if (!error) {
      setShowCompleteModal(false)
      setCompletingVisit(null)
      setCompletionComment('')
      setCompletionImages([])
      fetchCompletions()
    }
  }

  const filteredVisits = filterType === 'all'
    ? visits
    : visits.filter(v => v.type === filterType)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">School Visits</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all school tours and fair visits</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingVisit(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Visit
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={16} className="text-gray-400" />
        {['all', 'jordan_tour', 'international_fair'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={"px-3 py-1 rounded-full text-sm font-medium transition " + (filterType === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}
          >
            {type === 'all' ? 'All' : type === 'jordan_tour' ? 'Jordan Tours' : 'International Fairs'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">School Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">City</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Country</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Public/Private</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Visit Date</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Accomplished</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">No visits found</td>
              </tr>
            ) : (
              filteredVisits.map((visit) => (
                <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{visit.school_name}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-1 rounded-full text-xs font-medium " + (visit.type === 'jordan_tour' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {visit.type === 'jordan_tour' ? 'Jordan Tour' : 'International Fair'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{visit.city || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{visit.country || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{visit.private_or_public}</td>
                  <td className="px-4 py-3 text-gray-600">{visit.visit_date}</td>
                  <td className="px-4 py-3">
                    {completions[visit.id] ? (
                      <div>
                        <span className="text-xs text-green-600 font-medium">✓ Done</span>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{completions[visit.id].comment}</p>
                        {completions[visit.id].images?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {completions[visit.id].images.map((url, i) => (
                              <img key={i} src={url} alt="visit" className="w-8 h-8 rounded object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkDone(visit)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition"
                      >
                        <CheckCircle size={14} />
                        Mark Done
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(visit)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(visit.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingVisit ? 'Edit Visit' : 'Add New Visit'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input type="text" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Al-Ahliyya School" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="jordan_tour">Jordan Tour</option>
                  <option value="international_fair">International Fair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Amman" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Jordan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public or Private *</label>
                <select value={form.private_or_public} onChange={(e) => setForm({ ...form, private_or_public: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
                <input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                {editingVisit ? 'Save Changes' : 'Add Visit'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Visit Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Visit Accomplished</h2>
            <p className="text-sm text-gray-500 mb-4">"{completingVisit?.school_name}"</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What did you accomplish? *</label>
                <textarea
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Met with 30 students, collected 25 contacts, spoke with principal..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Photos (optional)</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
                  {uploadingImages ? 'Uploading...' : '+ Add Photos'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
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
              <button onClick={handleCompleteSubmit} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition">
                Save
              </button>
              <button onClick={() => { setShowCompleteModal(false); setCompletingVisit(null) }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}