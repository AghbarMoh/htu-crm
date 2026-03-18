'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react'

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [filterRole, setFilterRole] = useState('all')
  const supabase = createClient()

  const roles = ['Counselor', 'Manager', 'Ministry', 'Other']

  const emptyForm = {
    full_name: '',
    role: 'Counselor',
    school_name: '',
    email: '',
    phone: '',
    notes: '',
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setContacts(data)
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.full_name) {
      alert('Please fill in contact name')
      return
    }

    if (editingContact) {
      const { error } = await supabase
        .from('contacts')
        .update(form)
        .eq('id', editingContact.id)
      if (!error) {
        fetchContacts()
        setShowForm(false)
        setEditingContact(null)
        setForm(emptyForm)
      }
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert([form])
      if (!error) {
        fetchContacts()
        setShowForm(false)
        setForm(emptyForm)
      }
    }
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    setForm({
      full_name: contact.full_name || '',
      role: contact.role || 'Counselor',
      school_name: contact.school_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    if (!error) fetchContacts()
  }

  const filteredContacts = filterRole === 'all'
    ? contacts
    : contacts.filter(c => c.role === filterRole)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">Counselors, managers and important people</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingContact(null); setForm(emptyForm) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {['all', ...roles].map(role => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={"px-3 py-1 rounded-full text-sm font-medium transition " + (filterRole === role ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}
          >
            {role === 'all' ? 'All' : role}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">{filteredContacts.length} contacts</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Full Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">School</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Notes</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filteredContacts.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No contacts found</td></tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{contact.full_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {contact.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contact.school_name || '-'}</td>
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <a href={"mailto:" + contact.email} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail size={14} />
                        {contact.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {contact.phone ? (
                      <a href={"https://wa.me/" + contact.phone.replace(/\D/g, '')} target="_blank" className="flex items-center gap-1 text-green-600 hover:underline">
                        <Phone size={14} />
                        {contact.phone}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{contact.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(contact)} className="p-1 text-gray-400 hover:text-blue-600 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(contact.id)} className="p-1 text-gray-400 hover:text-red-500 transition">
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ahmad Al-Hassan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {roles.map(r => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input type="text" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Al-Ahliyya School" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. contact@school.edu.jo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 0791234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any additional notes..." rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingContact(null); setForm(emptyForm) }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}