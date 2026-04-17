'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  School, Users, ClipboardList, BookUser, CheckCircle,
  ChevronLeft, ChevronRight, Send, Bot, TrendingUp, 
  Calendar, Clock, MapPin, Heart, Bell
} from 'lucide-react'

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const pct = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(pct * target))
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return val
}

function StatCard({ label, value, icon: Icon, accent, href }) {
  const count = useCountUp(value)
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: `3px solid ${accent}`,
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
        }}
      >
        <div>
          <p style={{
            fontSize: '30px', fontWeight: '700', margin: '0 0 5px 0',
            background: `linear-gradient(135deg, #ffffff 40%, ${accent})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}>{count}</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
        </div>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: accent + '18',
          border: `1px solid ${accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s',
        }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
    </Link>
  )
}

const QUICK = [
  { label: '➕ Add Visit', text: 'Add a visit: ' },
  { label: '👤 Add Contact', text: 'Add contact: ' },
  { label: '✏️ Edit Visit', text: 'Change the time for my visit to [School Name] to [New Time].' },
  { label: '🗑️ Delete Visit', text: 'Cancel my visit to [School Name].' },
  { label: '📅 Check Date', text: 'What visits do I have scheduled for , and did I complete any?' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalApplicants: 0, totalVisits: 0, totalContacts: 0, totalVisitStudents: 0, matchedApplicants: 0 })
  const [allVisits, setAllVisits] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    text: `Hi Dalia, I'm your CRM Assistant. 👋<br/><br/>I can help you manage <b>school visits</b>, <b>contacts</b>, and your <b>schedule</b>.<br/><br/><div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; border-left: 3px solid #6366f1;"><b>⚠️ Quick Reminders:</b><br/>• <b>Add Visit:</b> SchoolName, Type, Visit Type, Date, Time, City, Companion.<br/>• <b>Add Contact:</b> Name, Role, School, Email, Phone.<br/>• <b>Edit/Delete:</b> Just refer to the <b>ID number</b> (e.g., <i>"Delete visit 12"</i>).</div><br/>If you don't know the ID, just ask me to <b>list</b> your visits or contacts first!`
  }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [dailyTip, setDailyTip] = useState('')

  // You can add as many tips as you want here!
  const lifeTips = [
    "Take a deep breath. You're doing better than you think.",
    "Progress, not perfection.",
    "Remember to drink water and step away from the screen.",
    "Your energy introduces you before you even speak.",
    "Small steps every day add up to massive results.",
    "Don't forget to celebrate the small wins.",
    "Kindness is a superpower.",
    "Focus on being productive, not just busy.",
    "A positive mindset brings positive things."
  ]
  

  useEffect(() => { 
    fetchDashboardData() 

    const fetchDailyTip = async () => {
      const today = new Date().toDateString() // e.g., "Fri Apr 17 2026"
      const cachedTip = localStorage.getItem('htu_daily_tip')
      const cachedDate = localStorage.getItem('htu_daily_tip_date')
      

      // 1. If we already fetched a tip today, just use the saved one
      if (cachedTip && cachedDate === today) {
        setDailyTip(cachedTip)
        return
      }

      // 2. If it's a new day, fetch a fresh tip from the internet
      try {
        // We are using the free 'Advice Slip' API which is perfect for short life tips
        const res = await fetch('https://api.adviceslip.com/advice')
        const data = await res.json()
        const newTip = data.slip.advice

        // Save it to state AND save it to the browser for the rest of the day
        setDailyTip(newTip)
        localStorage.setItem('htu_daily_tip', newTip)
        localStorage.setItem('htu_daily_tip_date', today)
        
      } catch (error) {
        // 3. The Fallback: If the internet is down or the API fails, 
        // we safely fall back to your hardcoded list so Dalia still gets a tip!
        const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) 
        setDailyTip(lifeTips[daysSinceEpoch % lifeTips.length])
      }
    }

    fetchDailyTip()
  }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
// --- Notification State ---
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // A robust time formatter that ignores timezone bugs
  const formatNotifTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return minutes + 'm ago'
    if (hours < 24) return hours + 'h ago'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Fetch Notifications on load
  // 1. Define the function so it's accessible everywhere
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/activity')
      const json = await res.json()
      if (json.data) {
        const lastRead = localStorage.getItem('htu_notif_read') || '1970-01-01T00:00:00.000Z'
        const newNotifs = json.data.filter(n => new Date(n.created_at) > new Date(lastRead))
        setNotifications(newNotifs.slice(0, 10))
        setUnreadCount(newNotifs.length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }

  // 2. Call it when the page first loads
  useEffect(() => {
    fetchNotifications()
  }, [])

  // The NEW "Clear" function that empties the list
  const handleClearNotifications = () => {
    localStorage.setItem('htu_notif_read', new Date().toISOString())
    setNotifications([]) // Instantly empties the dropdown UI
    setUnreadCount(0)
    setShowNotifications(false) 
  }


  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      
      const json = await res.json()
      
      if (json.profile) setUser(json.profile)
      if (json.stats) setStats(json.stats)
      if (json.allVisits) setAllVisits(json.allVisits)
      
      if (json.completions) {
        const map = {}
        json.completions.forEach(c => { map[c.visit_id] = c })
        setCompletions(map)
      }
    } catch (error) {
      console.error("Dashboard proxy error:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    const updated = [...chatMessages, { role: 'user', text: userMsg }]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply || "Sorry, I ran into an issue." }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Connection dropped. Try again!" }])
    } finally {
      setChatLoading(false)
      // Give the database a half-second to breathe, then refresh the bell
      setTimeout(() => {
        fetchNotifications()
      }, 500)
    }
  }

  // Calendar helpers
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayStr = new Date().toISOString().split('T')[0]

  const visitsOnDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return allVisits.filter(v => v.visit_date === dateStr)
  }
  const isToday = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr === todayStr
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading dashboard...</p>
      </div>
    )
  }

  const STATS = [
    { label: 'Total Applicants', value: stats.totalApplicants, icon: ClipboardList, accent: '#3b82f6', href: '/dashboard/applicants' },
    { label: 'Completed Visits', value: stats.totalVisits, icon: School, accent: '#8b5cf6', href: '/dashboard/school-visits' },
    { label: 'Visit Students', value: stats.totalVisitStudents, icon: Users, accent: '#f59e0b', href: '/dashboard/visit-students' },
    { label: 'Matched', value: stats.matchedApplicants, icon: CheckCircle, accent: '#10b981', href: '/dashboard/applicants' },
    { label: 'Contacts', value: stats.totalContacts, icon: BookUser, accent: '#ec4899', href: '/dashboard/contacts' },
  ]

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const selectedVisits = selectedDay ? visitsOnDay(selectedDay) : []

  const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '22px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      {/* ── Header Area ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        
        {/* Left Side: Welcome & Tip */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Good morning, {user?.full_name?.split(' ')[0] || 'Dalia'} 
            <Heart size={20} color="#ef4444" fill="#ef4444" /> 
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {dailyTip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, fontStyle: 'italic' }}>
                <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginRight: '4px' }}>Tip of the day:</span> 
                {dailyTip}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px', padding: '10px', cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Bell size={20} color="#ffffff" />
            
            {/* The Red Badge */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', 
                color: '#ffffff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #0f1115' // Matches your dark background
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* The Dropdown Menu */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '50px', right: '0', width: '320px', 
              background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 50,
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Recent Activity</h3>
                <button onClick={handleClearNotifications} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                  Clear all
                </button>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No recent activity.</p>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: new Date(notif.created_at) > new Date(localStorage.getItem('htu_notif_read') || '1970') ? '#3b82f6' : 'transparent', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#ffffff' }}>
                          <span style={{ fontWeight: '600' }}>{notif.action}</span> {notif.entity_name && `• ${notif.entity_name}`}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {formatNotifTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <Link href="/dashboard/activity" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'none' }}>
                  View full activity log →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Bottom Grid: Calendar + Chat ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

        {/* ── Visit Calendar ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Visit Calendar</h2>
            </div>
            <Link href="/dashboard/school-visits" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none', opacity: 0.8 }}>View all →</Link>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button onClick={() => { setCalendarDate(new Date(year, month - 1, 1)); setSelectedDay(null) }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '5px 7px', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            ><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{monthName}</span>
            <button onClick={() => { setCalendarDate(new Date(year, month + 1, 1)); setSelectedDay(null) }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '5px 7px', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            ><ChevronRight size={14} /></button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', padding: '4px 0', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={'e' + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayVisits = visitsOnDay(day)
              const hasVisit = dayVisits.length > 0
              const allDone = hasVisit && dayVisits.every(v => completions[v.id])
              const someDone = hasVisit && dayVisits.some(v => completions[v.id]) && !allDone
              const isSelected = selectedDay === day
              const today = isToday(day)
              return (
                <div key={day}
                  onClick={() => hasVisit && setSelectedDay(isSelected ? null : day)}
                  style={{
                    textAlign: 'center', padding: '6px 2px', borderRadius: '8px',
                    cursor: hasVisit ? 'pointer' : 'default',
                    background: isSelected ? 'rgba(139,92,246,0.22)' : today ? 'rgba(59,130,246,0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(139,92,246,0.45)' : today ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (hasVisit && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (hasVisit && !isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '12px', fontWeight: today ? '700' : '400', color: today ? '#60a5fa' : isSelected ? '#a78bfa' : 'rgba(255,255,255,0.65)' }}>{day}</span>
                  {hasVisit && (
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: allDone ? '#10b981' : someDone ? '#f59e0b' : '#8b5cf6', margin: '2px auto 0' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[{ c: '#8b5cf6', l: 'Pending' }, { c: '#f59e0b', l: 'Partial' }, { c: '#10b981', l: 'Done' }].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: x.c }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>{x.l}</span>
              </div>
            ))}
          </div>

          {/* Selected day */}
          {selectedDay && selectedVisits.length > 0 && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                {selectedDay} {calendarDate.toLocaleDateString('en-US', { month: 'long' })} — {selectedVisits.length} visit{selectedVisits.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedVisits.map(visit => {
                  const done = completions[visit.id]
                  return (
                    <div key={visit.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: '10px',
                      background: done ? 'rgba(16,185,129,0.07)' : 'rgba(139,92,246,0.07)',
                      border: `1px solid ${done ? 'rgba(16,185,129,0.18)' : 'rgba(139,92,246,0.18)'}`,
                    }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>{visit.school_name}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                          {visit.visit_time ? visit.visit_time + ' · ' : ''}{visit.type}{visit.companion ? ' · ' + visit.companion : ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px',
                        background: done ? 'rgba(16,185,129,0.18)' : 'rgba(139,92,246,0.18)',
                        color: done ? '#34d399' : '#a78bfa',
                      }}>{done ? '✓ Done' : 'Pending'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── DaliaBot Chat Panel ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '520px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={15} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>CRM Assistant</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Online</span>
                </div>
              </div>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>by Aghbar</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px', paddingRight: '2px' }}>
            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div key={i} style={{
                  maxWidth: '86%',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  background: isUser ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isUser ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '14px',
                  borderBottomRightRadius: isUser ? '4px' : '14px',
                  borderBottomLeftRadius: isUser ? '14px' : '4px',
                  padding: '10px 13px',
                  fontSize: '13px', lineHeight: '1.55', color: '#ffffff',
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                }}>
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
              )
            })}
            {chatLoading && (
              <div style={{
                alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', borderBottomLeftRadius: '4px',
                padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center',
              }}>
                {[0, 1, 2].map(n => (
                  <div key={n} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', animation: `bounce 1.2s ${n * 0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick templates */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '2px', scrollbarWidth: 'none', flexShrink: 0 }}>
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => setChatInput(q.text)}
                style={{ whiteSpace: 'nowrap', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd', padding: '5px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.22)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#93c5fd' }}
              >{q.label}</button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendChat} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(e) } }}
              placeholder="Ask about your schedule…"
              disabled={chatLoading}
              rows={2}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '10px 13px', fontSize: '13px', color: '#fff',
                outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '12px', border: 'none',
                background: chatInput.trim() ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.07)',
                color: chatInput.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: chatInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.18s', flexShrink: 0,
              }}
            ><Send size={15} /></button>
          </form>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0) }
          30% { transform: translateY(-5px) }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}