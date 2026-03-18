'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingApplicant, setEditingApplicant] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
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
    full_name: '',
    phone: '',
    email: '',
    username: '',
    password_raw: '',
    nationality: '',
    national_no: '',
    semester: '',
    year: '',
    electronic_payment_no: '',
    application_no: '',
    application_date: '',
    paid: false,
    heard_about_htu: '',
    major: '',
    status: 'red',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchApplicants()
    runCrossReference()
  }, [])

  const fetchApplicants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .order('imported_at', { ascending: false })
    if (!error) setApplicants(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.full_name) {
      alert('Please fill in student name')
      return
    }

    if (editingApplicant) {
      const { error } = await supabase
        .from('applicants')
        .update(form)
        .eq('id', editingApplicant.id)
      if (!error) {
        fetchApplicants()
        setShowForm(false)
        setEditingApplicant(null)
        setForm(emptyForm)
      }
    } else {
      const { error } = await supabase
        .from('applicants')
        .insert([form])
      if (!error) {
        fetchApplicants()
        setShowForm(false)
        setForm(emptyForm)
      }
    }
  }

  const handleEdit = (applicant) => {
    setEditingApplicant(applicant)
    setForm({
      full_name: applicant.full_name || '',
      phone: applicant.phone || '',
      email: applicant.email || '',
      username: applicant.username || '',
      password_raw: applicant.password_raw || '',
      nationality: applicant.nationality || '',
      national_no: applicant.national_no || '',
      semester: applicant.semester || '',
      year: applicant.year || '',
      electronic_payment_no: applicant.electronic_payment_no || '',
      application_no: applicant.application_no || '',
      application_date: applicant.application_date ? applicant.application_date.split('T')[0] : '',
      paid: applicant.paid || false,
      heard_about_htu: applicant.heard_about_htu || '',
      major: applicant.major || '',
      status: applicant.status || 'red',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return
    const { error } = await supabase
      .from('applicants')
      .delete()
      .eq('id', id)
    if (!error) fetchApplicants()
  }

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('applicants')
      .update({ status: newStatus })
      .eq('id', id)
    if (!error) fetchApplicants()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)

    const XLSX = await import('xlsx')
    const reader = new FileReader()

    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      const applicants = rows.map(row => ({
        full_name: row['Student Name'] || row['full_name'] || '',
        phone: String(row['Phone number'] || row['phone'] || ''),
        email: row['Email'] || row['email'] || '',
        username: row['User Name'] || row['username'] || '',
        password_raw: String(row['Password'] || row['password_raw'] || ''),
        nationality: row['Nationality'] || row['nationality'] || '',
        national_no: String(row['National No'] || row['national_no'] || ''),
        semester: String(row['Semester'] || row['semester'] || ''),
        year: parseInt(row['Year'] || row['year']) || null,
        electronic_payment_no: String(row['Electronic Payment No'] || row['electronic_payment_no'] || ''),
        application_no: String(row['Application No'] || row['application_no'] || ''),
        application_date: row['Date'] ? (() => {
          const val = row['Date']
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString()
          }
          return new Date(val).toISOString()
        })() : null,
        paid: String(row['Paid'] || '').toUpperCase() === 'YES',
        heard_about_htu: row['How did you first hear about (HTU) and early admission?'] || row['heard_about_htu'] || '',
        major: row['MAJOR'] || row['major'] || '',
        status: String(row['Paid'] || '').toUpperCase() === 'YES' ? 'green' : 'red',
      })).filter(a => a.full_name)

      if (applicants.length === 0) {
        alert('No valid applicants found in the file')
        setImporting(false)
        e.target.value = ''
        return
      }

      const { error } = await supabase
        .from('applicants')
        .insert(applicants)

      if (!error) {
        alert(`Successfully imported ${applicants.length} applicants`)
        fetchApplicants()
        runCrossReference()
      } else {
        alert('Error importing applicants: ' + error.message)
      }

      setImporting(false)
      e.target.value = ''
    }

    reader.readAsArrayBuffer(file)
  }

  const runCrossReference = async () => {
    const { data: visitStudents } = await supabase
      .from('visit_students')
      .select('id, full_name, phone, email')

    const { data: currentApplicants } = await supabase
      .from('applicants')
      .select('id, full_name, phone, email')

    if (!visitStudents || !currentApplicants) return

    for (const vs of visitStudents) {
      const match = currentApplicants.find(a =>
        a.full_name?.toLowerCase() === vs.full_name?.toLowerCase() &&
        (a.phone === vs.phone || a.email === vs.email)
      )

      if (match) {
        await supabase.from('matches').upsert({
          visit_student_id: vs.id,
          applicant_name: match.full_name,
          applicant_email: match.email,
          applicant_phone: match.phone,
        }, { onConflict: 'visit_student_id' })

        await supabase.from('visit_students').update({
          is_matched: true,
          matched_applicant_id: match.id
        }).eq('id', vs.id)

        await supabase.from('applicants').update({
          is_matched: true,
          matched_visit_student_id: vs.id
        }).eq('id', match.id)
      }
    }

    const { data: savedMatches } = await supabase
      .from('matches')
      .select('*')

    if (savedMatches) {
      for (const m of savedMatches) {
        const applicant = currentApplicants.find(a =>
          a.full_name?.toLowerCase() === m.applicant_name?.toLowerCase() &&
          (a.phone === m.applicant_phone || a.email === m.applicant_email)
        )
        if (applicant) {
          await supabase.from('applicants').update({
            is_matched: true,
            matched_visit_student_id: m.visit_student_id
          }).eq('id', applicant.id)
        }
      }
    }

    fetchApplicants()
  }

  const getRowColor = (status) => {
    if (status === 'green') return 'bg-green-50'
    return 'bg-red-50'
  }

  const getStatusBadge = (status) => {
    if (status === 'green') return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  const filteredApplicants = filterStatus === 'all'
    ? applicants
    : applicants.filter(a => a.status === filterStatus)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Applicants</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all applicants and their status</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition cursor-pointer">
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to delete ALL applicants?')) return
              const { error } = await supabase.from('applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
              if (!error) fetchApplicants()
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Delete All
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingApplicant(null); setForm(emptyForm) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add Applicant
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        {['all', 'red', 'green'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">{filteredApplicants.length} applicants</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Major</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Paid</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">App No</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Matched</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : filteredApplicants.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">No applicants found</td>
              </tr>
            ) : (
              filteredApplicants.map((applicant) => (
                <tr key={applicant.id} className={`border-b border-gray-100 ${getRowColor(applicant.status)}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {applicant.full_name}
                    {applicant.is_matched && (
                      <span className="ml-2 px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-600">
                        ✓ Visit
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{applicant.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{applicant.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{applicant.major || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      applicant.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {applicant.paid ? 'Paid' : 'Not Paid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{applicant.application_no || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {applicant.is_matched ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        ✓ Matched
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        No match
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={applicant.status}
                      onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${getStatusBadge(applicant.status)}`}
                    >
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(applicant)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(applicant.id)}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingApplicant ? 'Edit Applicant' : 'Add New Applicant'}
            </h2>

            <div className="space-y-3">
              {[
                { label: 'Full Name *', key: 'full_name', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Username', key: 'username', type: 'text' },
                { label: 'Password', key: 'password_raw', type: 'text' },
                { label: 'Nationality', key: 'nationality', type: 'text' },
                { label: 'National No', key: 'national_no', type: 'text' },
                { label: 'Semester', key: 'semester', type: 'text' },
                { label: 'Year', key: 'year', type: 'number' },
                { label: 'Electronic Payment No', key: 'electronic_payment_no', type: 'text' },
                { label: 'Application No', key: 'application_no', type: 'text' },
                { label: 'Application Date', key: 'application_date', type: 'date' },
                { label: 'How did you hear about HTU?', key: 'heard_about_htu', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                <select
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a major</option>
                  {majors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid</label>
                <select
                  value={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.value === 'true' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                {editingApplicant ? 'Save Changes' : 'Add Applicant'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingApplicant(null); setForm(emptyForm) }}
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