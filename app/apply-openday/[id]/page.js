'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function ApplyOpenDayPage() {
  const { id } = useParams()
  const [openDay, setOpenDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    feedback: '',
  })

  useEffect(() => {
    const fetchOpenDay = async () => {
      try {
        const res = await fetch(`/api/open-day?id=${id}`)
        const json = await res.json()
        if (json.openDay) setOpenDay(json.openDay)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    if (id) fetchOpenDay()
  }, [id])

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.email || !form.date_of_birth || !form.feedback) {
      alert('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/open-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_visitor',
          payload: { ...form, open_day_id: id }
        })
      })
      const json = await res.json()
      if (json.success) setSubmitted(true)
      else alert('Something went wrong. Please try again.')
    } catch (e) {
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '13px 15px',
    fontSize: '15px',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    WebkitAppearance: 'none',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '7px',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <img src="/logo.png" alt="HTU Logo" style={{ height: '48px', width: 'auto', opacity: 0.6, display: 'block', margin: '0 auto' }} />
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>Loading...</div>
      </div>
    )
  }

  if (!openDay) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
        <img src="/logo.png" alt="HTU Logo" style={{ height: '48px', width: 'auto', opacity: 0.5, display: 'block', margin: '0 auto' }} />
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>
          This open day link is invalid or has expired.
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <img src="/logo.png" alt="HTU Logo" style={{ height: '56px', width: 'auto', marginBottom: '20px', display: 'block', margin: '0 auto 20px auto' }} />
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(214,48,39,0.15)', border: '1px solid rgba(214,48,39,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={30} color="#D63027" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '10px' }}>Thank you!</div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
            Your visit information has been submitted successfully. We hope you enjoyed the open day at HTU!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px 48px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* HTU Branded Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="HTU Logo" style={{ height: '64px', width: 'auto', marginBottom: '16px', display: 'block', margin: '0 auto 16px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#D63027', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Al-Hussein Technical University
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.4px', marginBottom: '6px' }}>
            {openDay.label}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
            {formatDate(openDay.event_date)}
          </div>
        </div>

        {/* Form Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px 24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '22px' }}>
            Please fill in your information
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="Your full name" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} type="tel" placeholder="e.g. 0791234567" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Email Address *</label>
              <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input style={inputStyle} type="date" value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>

            {/* Cause of Visit removed */}

            <div>
              <label style={labelStyle}>Feedback *</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                placeholder="What did you gain from today's open day? Any thoughts or suggestions..."
                value={form.feedback}
                onChange={e => setForm({ ...form, feedback: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', marginTop: '26px', background: '#D63027', border: 'none', borderRadius: '13px', padding: '15px', fontSize: '15px', fontWeight: '700', color: '#ffffff', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit', letterSpacing: '-0.2px', boxShadow: '0 4px 16px rgba(214,48,39,0.3)' }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>
          HTU Students Recruitment & Outreach Office
        </div>
      </div>
    </div>
  )
}