'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation' // <-- NEW: Official Next.js URL reader

export default function StudentApplyPage() {
  // <-- NEW: Safely grab the visit_id from the URL
  const params = useParams() 
  const visit_id = params?.visit_id 

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    grade: '',
    major_dropdown: '',
    major_custom: '',
    certificate_type: ''
  })
  
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name) return alert("Please enter your full name.")
    if (!visit_id) return alert("Error: Missing Visit ID. Please scan the QR code again.") // <-- Safety check
    
    setStatus('submitting')

    const finalMajor = form.major_dropdown === 'Other' ? form.major_custom : form.major_dropdown

    try {
      const res = await fetch('/api/submit-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visit_id: visit_id, // Safely passes the ID to the database
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          grade: form.grade,
          major_interested: finalMajor,
          certificate_type: form.certificate_type
        })
      })

      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  const s = {
    container: { minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' },
    card: { background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' },
    header: { textAlign: 'center', marginBottom: '32px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' },
    subtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' },
    input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', marginBottom: '20px', outline: 'none', background: '#ffffff', color: '#000000', boxSizing: 'border-box' },
    button: { width: '100%', padding: '16px', background: '#C0392B', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    successMsg: { textAlign: 'center', padding: '40px 0' }
  }

  if (status === 'success') {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.successMsg}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={s.title}>You're all set!</h2>
            <p style={s.subtitle}>Thanks for connecting with HTU. We'll be in touch soon.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Join HTU</h1>
          <p style={s.subtitle}>Enter your info to stay connected!</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Full Name *</label>
          <input style={s.input} type="text" placeholder="e.g. Ahmad Ali" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />

          <label style={s.label}>Phone Number</label>
          <input style={s.input} type="tel" placeholder="e.g. 0791234567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />

          <label style={s.label}>Email Address</label>
          <input style={s.input} type="email" placeholder="ahmad@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />

          <label style={s.label}>Current Grade</label>
          <select style={s.input} value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
            <option value="">Select your grade</option>
            <option value="8th Grade">8th Grade</option>
            <option value="9th Grade">9th Grade</option>
            <option value="10th Grade">10th Grade</option>
            <option value="11th Grade">11th Grade</option>
            <option value="12th Grade">12th Grade</option>
          </select>

          <label style={s.label}>Certificate Type</label>
          <select style={s.input} value={form.certificate_type} onChange={e => setForm({...form, certificate_type: e.target.value})}>
            <option value="">Select Certificate</option>
            <option value="BTEC اكاديمي/ تكنولوجيا المعلومات">BTEC اكاديمي/ تكنولوجيا المعلومات</option>
            <option value="BTEC اكاديمي/ مسار الانشاءات و البيئة المبنية">BTEC اكاديمي/ مسار الانشاءات و البيئة المبنية</option>
            <option value="BTEC اكاديمي/ مسار هندسي">BTEC اكاديمي/ مسار هندسي</option>
            <option value="حقل الصحي + مادة الرياضيات">حقل الصحي + مادة الرياضيات</option>
            <option value="حقل العلوم و التكنولوجيا">حقل العلوم و التكنولوجيا</option>
            <option value="حقل الهندسي">حقل الهندسي</option>
            <option value="حقل مدمج ( الهندسي + العلوم و التكنولوجيا)">حقل مدمج ( الهندسي + العلوم و التكنولوجيا)</option>
            <option value="توجيهي علمي">توجيهي علمي</option>
            <option value="توجيهي صناعي">توجيهي صناعي</option>
            <option value="IGCSE">IGCSE</option>
            <option value="IB">IB</option>
            <option value="SAT">SAT</option>
          </select>

          <label style={s.label}>Major Interested In</label>
          <select style={{ ...s.input, marginBottom: form.major_dropdown === 'Other' ? '10px' : '20px' }} value={form.major_dropdown} onChange={e => setForm({...form, major_dropdown: e.target.value})}>
            <option value="">Select a major</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Game Design and Development">Game Design and Development</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Data Science and Artificial Intelligence">Data Science and Artificial Intelligence</option>
            <option value="Energy Engineering">Energy Engineering</option>
            <option value="Architectural Engineering">Architectural Engineering</option>
            <option value="Industrial Engineering">Industrial Engineering</option>
            <option value="Other">Others</option>
          </select>

          {form.major_dropdown === 'Other' && (
            <input 
              style={s.input} 
              type="text" 
              placeholder="Please specify your major..." 
              value={form.major_custom} 
              onChange={e => setForm({...form, major_custom: e.target.value})} 
              autoFocus
            />
          )}

          <button style={s.button} type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Submitting...' : 'Submit Details'}
          </button>
          
          {status === 'error' && (
             <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}