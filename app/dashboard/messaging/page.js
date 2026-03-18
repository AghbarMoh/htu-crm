'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Mail, MessageCircle, Send, Users, BookUser, School } from 'lucide-react'

export default function MessagingPage() {
  const [applicants, setApplicants] = useState([])
  const [contacts, setContacts] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
  const [selectedEmails, setSelectedEmails] = useState([])
  const [selectedPhones, setSelectedPhones] = useState([])
  const [activeTab, setActiveTab] = useState('email')
  const [sourceTab, setSourceTab] = useState('applicants')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filterPaid, setFilterPaid] = useState('all')
  const [filterMajor, setFilterMajor] = useState('all')
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

  const templates = [
    {
      label: 'Complete Application',
      subject: 'Complete Your HTU Application',
      body: 'Dear Student,\n\nWe noticed that you have not yet completed your application to HTU. Please log in to your account and complete the remaining steps.\n\nIf you need any assistance, please do not hesitate to contact us.\n\nBest regards,\nHTU Admissions Team',
    },
    {
      label: 'Payment Reminder',
      subject: 'HTU Application - Payment Reminder',
      body: 'Dear Student,\n\nThis is a reminder that your application fee payment is still pending. Please complete your payment to secure your place at HTU.\n\nBest regards,\nHTU Admissions Team',
    },
    {
      label: 'Welcome Message',
      subject: 'Welcome to HTU!',
      body: 'Dear Student,\n\nCongratulations! We are pleased to inform you that your application to HTU has been received successfully.\n\nWe look forward to welcoming you to our university.\n\nBest regards,\nHTU Admissions Team',
    },
  ]

  useEffect(() => {
    fetchApplicants()
    fetchContacts()
    fetchVisitStudents()
  }, [])

  const fetchApplicants = async () => {
    const { data, error } = await supabase
      .from('applicants')
      .select('id, full_name, email, phone, paid, major')
      .order('full_name')
    if (!error) setApplicants(data)
    setLoading(false)
  }

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, phone')
      .order('full_name')
    if (!error) setContacts(data)
  }

  const fetchVisitStudents = async () => {
    const { data, error } = await supabase
      .from('visit_students')
      .select('id, full_name, email, phone')
      .order('full_name')
    if (!error) setVisitStudents(data)
  }

  const getFilteredApplicants = () => {
    let list = applicants
    if (filterPaid === 'paid') list = list.filter(a => a.paid)
    if (filterPaid === 'notpaid') list = list.filter(a => !a.paid)
    if (filterMajor !== 'all') list = list.filter(a => a.major === filterMajor)
    return list
  }

  const currentList = sourceTab === 'applicants'
    ? getFilteredApplicants()
    : sourceTab === 'contacts'
    ? contacts
    : visitStudents

  const toggleEmail = (email) => {
    if (!email) return
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  const togglePhone = (phone) => {
    if (!phone) return
    setSelectedPhones(prev =>
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    )
  }

  const selectAllEmails = () => {
    const emails = currentList.map(p => p.email).filter(Boolean)
    setSelectedEmails(emails)
  }

  const clearSelection = () => {
    setSelectedEmails([])
    setSelectedPhones([])
  }

  const handleSendEmail = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one email')
      return
    }
    if (!emailSubject || !emailBody) {
      alert('Please fill in subject and message')
      return
    }

    setSending(true)

    const { error } = await supabase
      .from('messages_log')
      .insert([{
        channel: 'email',
        recipients: selectedEmails,
        subject: emailSubject,
        body: emailBody,
      }])

    if (!error) {
      const mailtoLink = 'mailto:' + selectedEmails.join(',') +
        '?subject=' + encodeURIComponent(emailSubject) +
        '&body=' + encodeURIComponent(emailBody)
      window.location.href = mailtoLink
      alert('Email client opened with ' + selectedEmails.length + ' recipients.')
      clearSelection()
      setEmailSubject('')
      setEmailBody('')
    }

    setSending(false)
  }

  const generateWALink = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('0') ? '962' + cleaned.slice(1) : cleaned
    return 'https://wa.me/' + number
  }

  const applyTemplate = (template) => {
    setEmailSubject(template.subject)
    setEmailBody(template.body)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Messaging</h1>
        <p className="text-gray-500 text-sm mt-1">Send bulk emails or WhatsApp messages</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-xl shadow-sm p-4">
          {/* Source Tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            <button
              onClick={() => { setSourceTab('applicants'); clearSelection() }}
              className={"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition " + (sourceTab === 'applicants' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}
            >
              <Users size={12} />
              Applicants
            </button>
            <button
              onClick={() => { setSourceTab('visitstudents'); clearSelection() }}
              className={"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition " + (sourceTab === 'visitstudents' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}
            >
              <School size={12} />
              Visit Students
            </button>
            <button
              onClick={() => { setSourceTab('contacts'); clearSelection() }}
              className={"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition " + (sourceTab === 'contacts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}
            >
              <BookUser size={12} />
              Contacts
            </button>
          </div>

          {/* Filters for Applicants */}
          {sourceTab === 'applicants' && (
            <div className="space-y-2 mb-3">
              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All (Paid + Not Paid)</option>
                <option value="paid">Paid Only</option>
                <option value="notpaid">Not Paid Only</option>
              </select>
              <select
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Majors</option>
                {majors.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Select All / Clear */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{selectedEmails.length} selected</span>
            <div className="flex gap-2">
              <button onClick={selectAllEmails} className="text-xs text-blue-600 hover:underline">Select All</button>
              <button onClick={clearSelection} className="text-xs text-red-400 hover:underline">Clear</button>
            </div>
          </div>

          {/* People List */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
            ) : currentList.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No records found</p>
            ) : (
              currentList.map((person) => (
                <div
                  key={person.id}
                  className={"flex items-center gap-2 p-2 rounded-lg cursor-pointer transition " + (selectedEmails.includes(person.email) ? 'bg-blue-50' : 'hover:bg-gray-50')}
                  onClick={() => activeTab === 'email' ? toggleEmail(person.email) : togglePhone(person.phone)}
                >
                  <input
                    type="checkbox"
                    checked={activeTab === 'email' ? selectedEmails.includes(person.email) : selectedPhones.includes(person.phone)}
                    onChange={() => {}}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{person.full_name}</p>
                    <p className="text-xs text-gray-400">{activeTab === 'email' ? (person.email || 'No email') : (person.phone || 'No phone')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Message Composer */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('email')}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " + (activeTab === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition " + (activeTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600')}
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
          </div>

          {activeTab === 'email' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {'To (' + selectedEmails.length + ' recipients)'}
                </label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-10 flex flex-wrap gap-1">
                  {selectedEmails.length === 0 ? (
                    <span className="text-gray-400">Select people from the left panel</span>
                  ) : (
                    selectedEmails.map((email, index) => (
                      <span key={email + index} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {email}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Complete Your HTU Application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your message here..."
                  rows={8}
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Quick templates:</p>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t)}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSendEmail}
                disabled={sending || selectedEmails.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
              >
                <Send size={16} />
                {sending ? 'Opening...' : 'Send Email'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Click Open Chat to message someone on WhatsApp directly.</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentList.filter(p => p.phone).map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{person.full_name}</p>
                      <p className="text-xs text-gray-400">{person.phone}</p>
                    </div>
                    <a
                      href={generateWALink(person.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition"
                    >
                      <MessageCircle size={14} />
                      Open Chat
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}