'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase' // <-- ADD THIS LINE

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
const supabase = createClient()

  // 1. Define the function FIRST
  const fetchUser = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionUser = sessionData?.session?.user
    if (sessionUser) {
      setUser(sessionUser)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single()
      if (profileData) setProfile(profileData)
    }
    setLoading(false)
  }

  // 2. Run it in useEffect AFTER it is defined
  useEffect(() => { 
    fetchUser() 
  }, [])

  const handleChangePassword = async () => {
    setPasswordMsg('')
    setPasswordError('')
    if (!newPassword || !confirmPassword) { setPasswordError('Please fill in both fields'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordError(error.message) }
    else { setPasswordMsg('Password updated successfully'); setNewPassword(''); setConfirmPassword('') }
  }

  const s = {
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '16px' },
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: '0 0 16px 0' },
    iconBox: (color) => ({ width: '32px', height: '32px', borderRadius: '8px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px' }),
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}><p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading settings...</p></div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage your account settings</p>
      </div>

      <div style={{ maxWidth: '520px' }}>
        {/* Account Info */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={s.iconBox('rgba(59,130,246,0.2)')}>
              <User size={16} style={{ color: '#3b82f6' }} />
            </div>
            <h2 style={s.sectionTitle}>Account Information</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Full Name', value: profile?.full_name || '-' },
              { label: 'Email', value: user?.email || '-' },
              { label: 'Role', value: profile?.role || '-' },
            ].map(item => (
              <div key={item.label}>
                <label style={s.label}>{item.label}</label>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', textTransform: item.label === 'Role' ? 'capitalize' : 'none' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={s.iconBox('rgba(139,92,246,0.2)')}>
              <Lock size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <h2 style={s.sectionTitle}>Change Password</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={s.label}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" style={s.input} />
            </div>
            <div>
              <label style={s.label}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={s.input} />
            </div>
            {passwordError && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{passwordError}</p>}
            {passwordMsg && <p style={{ fontSize: '12px', color: '#10b981', margin: 0 }}>{passwordMsg}</p>}
            <button onClick={handleChangePassword} style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#a78bfa', cursor: 'pointer', alignSelf: 'flex-start' }}>
              Update Password
            </button>
          </div>
        </div>

        {/* Access Level */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={s.iconBox('rgba(16,185,129,0.2)')}>
              <Shield size={16} style={{ color: '#10b981' }} />
            </div>
            <h2 style={s.sectionTitle}>Access Level</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { role: 'admin', label: 'Admin', desc: 'Full access — can manage all data and users', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
              { role: 'user', label: 'User', desc: 'Full access to all features', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
              { role: 'manager', label: 'Manager', desc: 'View-only access to reports and analytics', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
            ].map((r) => (
              <div key={r.role} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px',
                background: profile?.role === r.role ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: profile?.role === r.role ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: r.bg, color: r.color, flexShrink: 0 }}>{r.label}</span>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, flex: 1 }}>{r.desc}</p>
                {profile?.role === r.role && <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600', flexShrink: 0 }}>Current</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}