'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Lock, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
  setLoading(true)
  const { data: sessionData } = await supabase.auth.getSession()
  console.log('session:', sessionData)
  const sessionUser = sessionData?.session?.user
  console.log('session user:', sessionUser)
  if (sessionUser) {
    setUser(sessionUser)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single()
    console.log('profile:', profileData)
    if (profileData) setProfile(profileData)
  }
  setLoading(false)
}

  const handleChangePassword = async () => {
    setPasswordMsg('')
    setPasswordError('')

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordMsg('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User size={18} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Account Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{profile?.full_name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{user?.email || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg capitalize">{profile?.role || '-'}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Lock size={18} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Change Password</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Confirm new password"
              />
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            {passwordMsg && <p className="text-green-500 text-sm">{passwordMsg}</p>}
            <button
              onClick={handleChangePassword}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Shield size={18} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Access Level</h2>
          </div>
          <div className="space-y-2">
            {[
              { role: 'admin', label: 'Admin', desc: 'Full access — can manage all data and users', color: 'bg-red-100 text-red-700' },
              { role: 'user', label: 'User', desc: 'Full access to all features', color: 'bg-blue-100 text-blue-700' },
              { role: 'manager', label: 'Manager', desc: 'View-only access to reports and analytics', color: 'bg-green-100 text-green-700' },
            ].map((r) => (
              <div key={r.role} className={"flex items-center gap-3 p-3 rounded-lg " + (profile?.role === r.role ? 'border-2 border-blue-400 bg-blue-50' : 'bg-gray-50')}>
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + r.color}>{r.label}</span>
                <p className="text-sm text-gray-600">{r.desc}</p>
                {profile?.role === r.role && <span className="ml-auto text-xs text-blue-600 font-medium">Current</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}