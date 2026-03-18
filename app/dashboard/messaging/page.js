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

  const majors = ['Energy Engineering', 'Electrical Engineering', 'Game Design and Development', 'Architectural Engineering', 'Cyber Security', 'Computer Science', 'Data Science and AI', 'Industrial Engineering']

  const templates = [
    { label: 'Complete Application', subject: 'Complete Your HTU Application', body: 'Dear Student,\n\nWe noticed that you have not yet completed your application to HTU. Please log in to your account and complete the remaining steps.\n\nIf you need any assistance, please do not hesitate to contact us.\n\nBest regards,\nHTU Admissions Team' },
    { label: 'Payment Reminder', subject: 'HTU Application - Payment Reminder', body: 'Dear Student,\n\nThis is a reminder that your application fee payment is still pending. Please complete your payment to secure your place at HTU.\n\nBest regards,\nHTU Admissions Team' },
    { label: 'Welcome Message', subject: 'Welcome to HTU!', body: 'Dear Student,\n\nCongratulations! We are pleased to inform you that your application to HTU has been received successfully.\n\nWe look forward to welcoming you to our university.\n\nBest regards,\nHTU Admissions Team' },
  ]

  useEffect(() => { fetchApplicants(); fetchContacts(); fetchVisitStudents() }, [])

  const fetchApplicants = async () => {
    const { data, error } = await supabase.from('applicants').select('id, full_name, email, phone, paid, major').order('full_name')
    if (!error) setApplicants(data)
    setLoading(false)
  }

  const fetchContacts = async () => {
    const { data, error } = await supabase.from('contacts').select('id, full_name, email, phone').order('full_name')
    if (!error) setContacts(data)
  }

  const fetchVisitStudents = async () => {
    const { data, error } = await supabase.from('visit_students').select('id, full_name, email, phone').order('full_name')
    if (!error) setVisitStudents(data)
  }

  const getFilteredApplicants = () => {
    let list = applicants
    if (filterPaid === 'paid') list = list.filter(a => a.paid)
    if (filterPaid === 'notpaid') list = list.filter(a => !a.paid)
    if (filterMajor !== 'all') list = list.filter(a => a.major === filterMajor)
    return list
  }

  const currentList = sourceTab === 'applicants' ? getFilteredApplicants() : sourceTab === 'contacts' ? contacts : visitStudents

  const toggleEmail = (email) => {
    if (!email) return
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email])
  }

  const togglePhone = (phone) => {
    if (!phone) return
    setSelectedPhones(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone])
  }

  const selectAllEmails = () => setSelectedEmails(currentList.map(p => p.email).filter(Boolean))
  const clearSelection = () => { setSelectedEmails([]); setSelectedPhones([]) }

  const handleSendEmail = async () => {
    if (selectedEmails.length === 0) { alert('Please select at least one email'); return }
    if (!emailSubject || !emailBody) { alert('Please fill in subject and message'); return }
    setSending(true)
    const { error } = await supabase.from('messages_log').insert([{ channel: 'email', recipients: selectedEmails, subject: emailSubject, body: emailBody }])
    if (!error) {
      const mailtoLink = 'mailto:' + selectedEmails.join(',') + '?subject=' + encodeURIComponent(emailSubject) + '&body=' + encodeURIComponent(emailBody)
      window.location.href = mailtoLink
      alert('Email client opened with ' + selectedEmails.length + ' recipients.')
      clearSelection(); setEmailSubject(''); setEmailBody('')
    }
    setSending(false)
  }

  const generateWALink = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('0') ? '962' + cleaned.slice(1) : cleaned
    return 'https://wa.me/' + number
  }

  const s = {
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Messaging</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Send bulk emails or WhatsApp messages</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        {/* Left Panel */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[{ key: 'applicants', label: 'Applicants', icon: Users }, { key: 'visitstudents', label: 'Visit Students', icon: School }, { key: 'contacts', label: 'Contacts', icon: BookUser }].map(tab => (
              <button key={tab.key} onClick={() => { setSourceTab(tab.key); clearSelection() }} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer',
                background: sourceTab === tab.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: sourceTab === tab.key ? '#3b82f6' : 'rgba(255,255,255,0.4)',
              }}>
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {sourceTab === 'applicants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
                <option value="all">All (Paid + Not Paid)</option>
                <option value="paid">Paid Only</option>
                <option value="notpaid">Not Paid Only</option>
              </select>
              <select value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
                <option value="all">All Majors</option>
                {majors.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{selectedEmails.length} selected</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={selectAllEmails} style={{ fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>Select All</button>
              <button onClick={clearSelection} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            </div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', padding: '20px 0' }}>Loading...</p>
            ) : currentList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', padding: '20px 0' }}>No records found</p>
            ) : (
              currentList.map((person) => (
                <div key={person.id}
                  onClick={() => activeTab === 'email' ? toggleEmail(person.email) : togglePhone(person.phone)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedEmails.includes(person.email) ? 'rgba(59,130,246,0.1)' : 'transparent', transition: 'background 0.1s' }}
                >
                  <input type="checkbox" checked={activeTab === 'email' ? selectedEmails.includes(person.email) : selectedPhones.includes(person.phone)} onChange={() => {}} style={{ accentColor: '#3b82f6' }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff', margin: '0 0 1px 0' }}>{person.full_name}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{activeTab === 'email' ? (person.email || 'No email') : (person.phone || 'No phone')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[{ key: 'email', label: 'Email', icon: Mail, color: '#3b82f6' }, { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#10b981' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer',
                background: activeTab === tab.key ? (tab.key === 'email' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)') : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.4)',
              }}>
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'email' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                  {'To (' + selectedEmails.length + ' recipients)'}
                </label>
                <div style={{ minHeight: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedEmails.length === 0 ? (
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>Select people from the left panel</span>
                  ) : (
                    selectedEmails.map((email, i) => (
                      <span key={email + i} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>{email}</span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Subject</label>
                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="e.g. Complete Your HTU Application" style={s.input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Message</label>
                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Write your message here..." rows={7} style={{ ...s.input, resize: 'vertical' }} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Quick templates:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {templates.map(t => (
                    <button key={t.label} onClick={() => { setEmailSubject(t.subject); setEmailBody(t.body) }} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSendEmail} disabled={sending || selectedEmails.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: sending || selectedEmails.length === 0 ? 'not-allowed' : 'pointer', opacity: sending || selectedEmails.length === 0 ? 0.5 : 1, alignSelf: 'flex-start' }}>
                <Send size={14} />
                {sending ? 'Opening...' : 'Send Email'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Click Open Chat to message someone on WhatsApp directly.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {currentList.filter(p => p.phone).map((person) => (
                  <div key={person.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff', margin: '0 0 2px 0' }}>{person.full_name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{person.phone}</p>
                    </div>
                    <a href={generateWALink(person.phone)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#10b981', textDecoration: 'none' }}>
                      <MessageCircle size={13} />
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