'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function VisitStudentsPage() {
  const [students, setStudents] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [filterVisit, setFilterVisit] = useState('all')
  const [importVisitId, setImportVisitId] = useState('')
  const [importing, setImporting] = useState(false)
  const supabase = createClient()

  const majors = [
    'Energy Engineering',
    'Electrical Engineering',
    'Game Design and Development',
    'Architectural Engineering',
    'Cyber Security',
    'Computer Science',
    'Data Science and AI',
    'Industrial Engineering',
  ]

  const emptyForm = {
    visit_id: '',
    full_name: '',
    email: '',
    phone: '',
    grade: '',
    nationality: '',
    major_interested: '',
    certificate_type: '',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchStudents()
    fetchVisits()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('visit_students')
      .select('*, school_visits(school_name, visit_date)')
      .order('created_at', { ascending: false })
    if (!error) setStudents(data)
    setLoading(false)
  }

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from('school_visits')
      .select('id, school_name, visit_date')
      .order('visit_date', { ascending: false })
    if (!error) setVisits(data)
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.visit_id) {
      alert('Please fill in student name and select a school visit')
      return
    }

    if (editingStudent) {
      const { error } = await supabase
        .from('visit_students')
        .update(form)
        .eq('id', editingStudent.id)
      if (!error) {
        fetchStudents()
        setShowForm(false)
        setEditingStudent(null)
        setForm(emptyForm)
      }
    } else {
      const { error } = await supabase
        .from('visit_students')
        .insert([form])
      if (!error) {
        fetchStudents()
        setShowForm(false)
        setForm(emptyForm)
      }
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setForm({
      visit_id: student.visit_id,
      full_name: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      grade: student.grade || '',
      nationality: student.nationality || '',
      major_interested: student.major_interested || '',
      certificate_type: student.certificate_type || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    const { error } = await supabase
      .from('visit_students')
      .delete()
      .eq('id', id)
    if (!error) fetchStudents()
  }
  const handleImport = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!importVisitId) {
    alert('Please select a school visit before importing')
    e.target.value = ''
    return
  }

  setImporting(true)

  const XLSX = await import('xlsx')
  const reader = new FileReader()

  reader.onload = async (event) => {
    const data = new Uint8Array(event.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    const students = rows.map(row => ({
      visit_id: importVisitId,
      full_name: row['Full Name'] || row['full_name'] || '',
      email: row['Email'] || row['email'] || '',
      phone: row['Phone'] || row['phone'] || '',
      grade: row['Grade'] || row['grade'] || '',
      nationality: row['Nationality'] || row['nationality'] || '',
      major_interested: row['Major Interested'] || row['major_interested'] || '',
      certificate_type: row['Certificate Type'] || row['certificate_type'] || '',
    })).filter(s => s.full_name)

    if (students.length === 0) {
      alert('No valid students found in the file')
      setImporting(false)
      e.target.value = ''
      return
    }

    const { error } = await supabase
      .from('visit_students')
      .insert(students)

    if (!error) {
      alert(`Successfully imported ${students.length} students`)
      fetchStudents()
    } else {
      alert('Error importing students')
    }

    setImporting(false)
    e.target.value = ''
  }

  reader.readAsArrayBuffer(file)
}

  const filteredStudents = filterVisit === 'all'
    ? students
    : students.filter(s => s.visit_id === filterVisit)

  return (
    <div>
    {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visit Students</h1>
          <p className="text-gray-500 text-sm mt-1">Students collected during school visits</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Import section */}
          <select
            value={importVisitId}
            onChange={(e) => setImportVisitId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select visit to import into</option>
            {visits.map(v => (
              <option key={v.id} value={v.id}>
                {v.school_name} — {v.visit_date}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition cursor-pointer">
            {importing ? 'Importing...' : '↑ Import Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => { setShowForm(true); setEditingStudent(null); setForm(emptyForm) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Filter by visit */}
      <div className="mb-4">
        <select
          value={filterVisit}
          onChange={(e) => setFilterVisit(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All School Visits</option>
          {visits.map(v => (
            <option key={v.id} value={v.id}>
              {v.school_name} — {v.visit_date}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Full Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">School Visit</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Grade</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Nationality</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Major Interested</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Certificate</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Matched</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{student.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {student.school_visits?.school_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{student.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.grade || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.nationality || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.major_interested || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{student.certificate_type || '-'}</td>
                  <td className="px-4 py-3">
                    {student.is_matched ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✓ Matched
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Not matched
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Visit *</label>
                <select
                  value={form.visit_id}
                  onChange={(e) => setForm({ ...form, visit_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a visit</option>
                  {visits.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.school_name} — {v.visit_date}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mohammad Aghbar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. student@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 0791234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Jordanian"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major Interested</label>
                <select
                  value={form.major_interested}
                  onChange={(e) => setForm({ ...form, major_interested: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a major</option>
                  {majors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                <input
                  type="text"
                  value={form.certificate_type}
                  onChange={(e) => setForm({ ...form, certificate_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Tawjihi, IB, SAT"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                {editingStudent ? 'Save Changes' : 'Add Student'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingStudent(null); setForm(emptyForm) }}
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