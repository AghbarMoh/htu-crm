'use client'
import { useState, useEffect } from 'react'
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
  const [waMessage, setWaMessage] = useState('')
  const [listSearch, setListSearch] = useState('')
  
  // --- Campaign State ---
  const [campaignActive, setCampaignActive] = useState(false)
  const [campaignQueue, setCampaignQueue] = useState([])
  const [campaignIdx, setCampaignIdx] = useState(0)
  

  const majors = ['Energy Engineering', 'Electrical Engineering', 'Game Design and Development', 'Architectural Engineering', 'Cyber Security', 'Computer Science', 'Data Science and AI', 'Industrial Engineering']

  const templates = [
    { label: 'Complete Application', subject: 'Complete Your HTU Application', body: 'Dear Student,\n\nWe noticed that you have not yet completed your application to HTU. Please log in to your account and complete the remaining steps.\n\nIf you need any assistance, please do not hesitate to contact us.\n\nBest regards,\nHTU Admissions Team' },
    { label: 'Payment Reminder', subject: 'HTU Application - Payment Reminder', body: 'Dear Student,\n\nThis is a reminder that your application fee payment is still pending. Please complete your payment to secure your place at HTU.\n\nBest regards,\nHTU Admissions Team' },
    { label: 'Welcome Message', subject: 'Welcome to HTU!', body: 'Dear Student,\n\nCongratulations! We are pleased to inform you that your application to HTU has been received successfully.\n\nWe look forward to welcoming you to our university.\n\nBest regards,\nHTU Admissions Team' },
  ]

  useEffect(() => { fetchApplicants(); fetchContacts(); fetchVisitStudents() }, [])

  const fetchApplicants = async () => {
    try {
      const res = await fetch('/api/applicants')
      const json = await res.json()
      if (json.data) setApplicants(json.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      const json = await res.json()
      if (json.data) setContacts(json.data)
    } catch (err) { console.error(err) }
  }

  const fetchVisitStudents = async () => {
    try {
      const res = await fetch('/api/visit-students')
      const json = await res.json()
      if (json.students) setVisitStudents(json.students)
    } catch (err) { console.error(err) }
  }

  const getFilteredApplicants = () => {
    let list = applicants
    if (filterPaid === 'paid') list = list.filter(a => a.paid)
    if (filterPaid === 'notpaid') list = list.filter(a => !a.paid)
    if (filterMajor !== 'all') list = list.filter(a => a.major === filterMajor)
    return list
  }

  const baseList = sourceTab === 'applicants' ? getFilteredApplicants() : sourceTab === 'contacts' ? contacts : visitStudents
  const currentList = listSearch.trim()
    ? baseList.filter(p => p.full_name?.toLowerCase().includes(listSearch.toLowerCase()))
    : baseList

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
    
    try {
      const res = await fetch('/api/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          payload: { channel: 'email', recipients: selectedEmails, subject: emailSubject, body: emailBody }
        })
      })
      const json = await res.json()
      
      if (json.success) {
        const mailtoLink = 'mailto:' + selectedEmails.join(',') + '?subject=' + encodeURIComponent(emailSubject) + '&body=' + encodeURIComponent(emailBody)
        window.location.href = mailtoLink
        alert('Email client opened with ' + selectedEmails.length + ' recipients.')
        clearSelection()
        setEmailSubject('')
        setEmailBody('')
      } else {
        alert('Error logging message: ' + json.error)
      }
    } catch (error) {
      console.error('Messaging Proxy Error:', error)
    } finally {
      setSending(false)
    }
  }

  const generateWALink = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('0') ? '962' + cleaned.slice(1) : cleaned
    return 'https://wa.me/' + number
  }

  // --- Campaign Logic ---
  const startCampaign = () => {
    const queue = currentList.filter(p => selectedPhones.includes(p.phone) && p.phone)
    if (queue.length === 0) { alert('Select at least one contact with a phone number'); return }
    setCampaignQueue(queue)
    setCampaignIdx(0)
    setCampaignActive(true)
  }

  const handleCampaignSend = () => {
    const currentPerson = campaignQueue[campaignIdx]
    const link = generateWALink(currentPerson.phone) + (waMessage ? '?text=' + encodeURIComponent(waMessage) : '')
    window.open(link, '_blank')
    nextCampaignStep()
  }

  const handleCampaignSkip = () => nextCampaignStep()

  const nextCampaignStep = () => {
    if (campaignIdx < campaignQueue.length - 1) {
      setCampaignIdx(prev => prev + 1)
    } else {
      setCampaignActive(false)
      alert('WhatsApp Campaign Completed! 🎉')
    }
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
            {[
              { key: 'applicants', label: 'Applicants', icon: Users, count: applicants.length },
              { key: 'visitstudents', label: 'Leads', icon: School, count: visitStudents.length },
              { key: 'contacts', label: 'Contacts', icon: BookUser, count: contacts.length }
            ].map(tab => (
              <button key={tab.key} onClick={() => { setSourceTab(tab.key); clearSelection() }} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer',
                background: sourceTab === tab.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: sourceTab === tab.key ? '#3b82f6' : 'rgba(255,255,255,0.4)',
              }}>
                <tab.icon size={12} />
                {tab.label}
                <span style={{
                  fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px',
                  background: sourceTab === tab.key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                  color: sourceTab === tab.key ? '#93c5fd' : 'rgba(255,255,255,0.3)',
                }}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              onChange={e => setListSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px 8px 30px', fontSize: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {sourceTab === 'applicants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
                <option value="all" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>All (Paid + Not Paid)</option>
                <option value="paid" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Paid Only</option>
                <option value="notpaid" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>Not Paid Only</option>
              </select>
              <select value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', outline: 'none' }}>
                <option value="all" style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>All Majors</option>
                {majors.map(m => <option key={m} value={m} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>{m}</option>)}
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
                    <p dir="auto" style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff', margin: '0 0 1px 0' }}>{person.full_name}</p>
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
                    selectedEmails.map((email, i) => {
                      const person = currentList.find(p => p.email === email)
                      const initials = person?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                      const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#06b6d4']
                      const color = colors[i % colors.length]
                      return (
                        <span key={email + i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 4px', borderRadius: '20px', fontSize: '11px', background: `${color}18`, border: `1px solid ${color}30`, color }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: color, color: '#fff', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</span>
                          {person?.full_name?.split(' ')[0] || email}
                        </span>
                      )
                    })
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Subject</label>
                <input dir="auto" type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="e.g. Complete Your HTU Application" style={s.input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Message</label>
                <textarea dir="auto" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Write your message here..." rows={7} style={{ ...s.input, resize: 'vertical' }} />
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
          ):(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Message Template (optional)</label>
                <textarea dir="auto" value={waMessage} onChange={(e) => setWaMessage(e.target.value)} placeholder="Write a message to pre-fill in WhatsApp... (optional)" rows={4} style={{ ...s.input, resize: 'vertical' }} disabled={campaignActive} />
              </div>

              {!campaignActive ? (
                // --- NORMAL LIST MODE ---
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      {selectedPhones.length > 0 ? selectedPhones.length + ' selected' : 'Select people from the left panel'}
                    </p>
                    {selectedPhones.length > 0 && (
                      <button onClick={startCampaign} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
                        <Send size={14} /> Start Campaign
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {currentList.filter(p => p.phone).map(person => (
                      <div key={person.id} onClick={() => togglePhone(person.phone)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: selectedPhones.includes(person.phone) ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: selectedPhones.includes(person.phone) ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={selectedPhones.includes(person.phone)} onChange={() => {}} style={{ accentColor: '#10b981' }} />
                          <div>
                            <p dir="auto" style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff', margin: '0 0 2px 0' }}>{person.full_name}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{person.phone}</p>
                          </div>
                        </div>
                        <a href={generateWALink(person.phone) + (waMessage ? '?text=' + encodeURIComponent(waMessage) : '')} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#10b981', textDecoration: 'none' }}>
                          <MessageCircle size={13} /> Open
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // --- CAMPAIGN ACTIVE MODE ---
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginTop: '10px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Campaign Progress</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{campaignIdx + 1} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400' }}>of {campaignQueue.length}</span></span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${((campaignIdx + 1) / campaignQueue.length) * 100}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                    {campaignQueue[campaignIdx]?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                  </div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <h3 dir="auto" style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ffffff' }}>{campaignQueue[campaignIdx]?.full_name}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{campaignQueue[campaignIdx]?.phone}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={handleCampaignSkip} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                      Skip
                    </button>
                    <button onClick={handleCampaignSend} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#10b981', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                      <Send size={16} /> Send & Next
                    </button>
                  </div>

                  <button onClick={() => setCampaignActive(false)} style={{ marginTop: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}>
                    End Campaign Early
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}