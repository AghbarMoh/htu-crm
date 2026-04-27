'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  School, Users, CheckCircle,
  ChevronLeft, ChevronRight, Send, Bot, TrendingUp, 
  Calendar, Clock, MapPin, Heart, Bell, AlertTriangle, QrCode
} from 'lucide-react'

import dynamic from 'next/dynamic'

// Dynamically import the map so it doesn't crash the Next.js server
const VisitsMap = dynamic(() => import('@/components/VisitsMap'), { 
  ssr: false, 
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading interactive map...</div> 
})

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

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


const APPLICANT_HREF = '/dashboard/applicants/pending'
const COMPLETED_HREF = '/dashboard/applicants/completed'

function VisitCalendar({ allVisits, completions, todayStr }) {
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate()

  const visitMap = {}
  allVisits.forEach(v => {
    if (!v.visit_date || v.is_cancelled) return
    const vDate = v.visit_date.slice(0, 10)
    if (!visitMap[vDate]) visitMap[vDate] = []
    visitMap[vDate].push(v)
  })

  const goPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const goNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const selectedVisits = visitMap[selectedDate] || []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Visit Calendar</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={goPrev} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: '12px' }}>◀</button>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', minWidth: '110px', textAlign: 'center' }}>{monthNames[calMonth]} {calYear}</span>
          <button onClick={goNext} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: '12px' }}>▶</button>
        </div>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.25)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {/* Padding days from prev month */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`pad-${i}`} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'rgba(255,255,255,0.08)', fontSize: '12px' }}>
            {prevMonthDays - firstDay + 1 + i}
          </div>
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const hasVisits = !!visitMap[dateStr]?.length
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr
          const hasCompleted = visitMap[dateStr]?.some(v => completions[v.id])

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: isSelected ? '1px solid #8b5cf6' : '1px solid transparent',
                background: isSelected ? 'rgba(139,92,246,0.15)' : isToday ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer',
                position: 'relative',
                padding: 0,
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: isToday ? '700' : '500', color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.7)' }}>{dayNum}</span>
              {hasVisits && (
                <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: hasCompleted ? '#10b981' : '#f59e0b' }} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day visits */}
      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>

        {/* Mini liquid ball showing completion rate for selected day */}
        {selectedVisits.length > 0 && (() => {
          const doneCount = selectedVisits.filter(v => !!completions[v.id]).length
          const pct = Math.round((doneCount / selectedVisits.length) * 100)
          const waveY = pct === 0 ? 100 : (100 - pct)
          const accent = pct === 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#8b5cf6'
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              {/* Ball */}
              <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                <svg width="64" height="64" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                  <defs>
                    <clipPath id="calDayClip"><circle cx="32" cy="32" r="27" /></clipPath>
                  </defs>
                  <circle cx="32" cy="32" r="30" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.15" />
                  <circle cx="32" cy="32" r="27" fill="rgba(255,255,255,0.02)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" />
                  <g clipPath="url(#calDayClip)">
                    <rect x="0" y={`${waveY}%`} width="64" height="64" fill={accent} fillOpacity="0.15"
                      style={{ transition: 'y 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                    <g style={{ animation: 'liquidWave1 3s ease-in-out infinite' }}>
                      <path d={`M-32,${waveY * 0.64} C-16,${waveY * 0.64 - 5} 0,${waveY * 0.64 + 5} 16,${waveY * 0.64} C32,${waveY * 0.64 - 5} 48,${waveY * 0.64 + 5} 64,${waveY * 0.64} C80,${waveY * 0.64 - 5} 96,${waveY * 0.64 + 5} 112,${waveY * 0.64} L112,128 L-32,128 Z`}
                        fill={accent} fillOpacity="0.4" />
                    </g>
                    <g style={{ animation: 'liquidWave2 4s ease-in-out infinite' }}>
                      <path d={`M-32,${waveY * 0.64 + 4} C-16,${waveY * 0.64 + 9} 0,${waveY * 0.64 - 1} 16,${waveY * 0.64 + 4} C32,${waveY * 0.64 + 9} 48,${waveY * 0.64 - 1} 64,${waveY * 0.64 + 4} C80,${waveY * 0.64 + 9} 96,${waveY * 0.64 - 1} 112,${waveY * 0.64 + 4} L112,128 L-32,128 Z`}
                        fill={accent} fillOpacity="0.2" />
                    </g>
                  </g>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', lineHeight: '1', textShadow: `0 0 10px ${accent}` }}>{pct}%</span>
                  <span style={{ fontSize: '8px', color: accent, marginTop: '1px', fontWeight: '600' }}>{doneCount}/{selectedVisits.length}</span>
                </div>
              </div>
              {/* Date label + summary */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 3px 0' }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px 0' }}>
                  {doneCount === selectedVisits.length ? '✓ All visits complete' : doneCount > 0 ? `${doneCount} done · ${selectedVisits.length - doneCount} pending` : `${selectedVisits.length} visit${selectedVisits.length !== 1 ? 's' : ''} pending`}
                </p>
                <span style={{
                  fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                  background: pct === 100 ? 'rgba(16,185,129,0.15)' : pct > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                  color: pct === 100 ? '#34d399' : pct > 0 ? '#fbbf24' : '#a78bfa',
                }}>
                  {pct === 100 ? '🎉 Complete' : pct > 0 ? '⏳ In progress' : '📅 Upcoming'}
                </span>
              </div>
            </div>
          )
        })()}

        {/* No visits message */}
        {selectedVisits.length === 0 && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0, padding: '8px 0' }}>No visits scheduled.</p>
        )}

        {/* Visit cards */}
        {selectedVisits.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedVisits.map(visit => {
              const done = !!completions[visit.id]
              return (
                <Link key={visit.id} href="/dashboard/school-visits" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '8px',
                    background: done ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>{visit.school_name}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        {visit.visit_time || '—'}{visit.type ? ' · ' + visit.type : ''}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: done ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                      color: done ? '#34d399' : '#a78bfa',
                      flexShrink: 0,
                    }}>{done ? '✓ Done' : 'Pending'}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalApplicants: 0, completedApplicants: 0, totalVisits: 0, totalContacts: 0, totalVisitStudents: 0, matchedApplicants: 0 })
  const [allVisits, setAllVisits] = useState([])
  const [completedApplicantSchools, setCompletedApplicantSchools] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dailyTip, setDailyTip] = useState('')
  const [tasks, setTasks] = useState([])
  const [quickTask, setQuickTask] = useState('')
  const [quickDue, setQuickDue] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [completingTask, setCompletingTask] = useState(null)

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
    fetchTasksData()
    fetchNotifications()

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
        const res = await fetch('/api/quote')
        const data = await res.json()
        const newTip = `"${data.quote}" — ${data.author}`
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

  const fetchTasksData = async () => {
    try {
      const res = await fetch('/api/tasks')
      const json = await res.json()
      if (json.tasks) {
        const pending = json.tasks
          .filter(t => !t.is_done)
          .sort((a, b) => new Date(a.due_date || '9999') - new Date(b.due_date || '9999'))
        setTasks(pending.slice(0, 5))
      }
    } catch (e) { console.error(e) }
  }

  const handleQuickAddTask = async () => {
    if (!quickTask.trim()) return
    setAddingTask(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          payload: { title: quickTask, description: '', due_date: quickDue || null }
        })
      })
      setQuickTask('')
      setQuickDue('')
      fetchTasksData()
    } catch (e) { console.error(e) } finally { setAddingTask(false) }
  }

  const handleCompleteTask = async (task) => {
    setCompletingTask(task.id)
    await new Promise(r => setTimeout(r, 600))
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_done',
        payload: { id: task.id, is_done: true, title: task.title }
      })
    })
    setCompletingTask(null)
    fetchTasksData()
  }
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      
      const json = await res.json()
      
      if (json.profile) setUser(json.profile)
      if (json.stats) setStats(json.stats)
      if (json.allVisits) {
        setAllVisits(json.allVisits)
      }
      if (json.completedApplicantSchools) {
        setCompletedApplicantSchools(json.completedApplicantSchools)
      }
      
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

  const now = new Date()
const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading dashboard...</p>
      </div>
    )
  }

  // Fuzzy match: check if two school names are similar enough
  const fuzzyMatch = (a, b) => {
    if (!a || !b) return false
const clean = s => String(s).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/g, '').trim()   
 const ca = clean(a)
    const cb = clean(b)
    if (ca === cb) return true
    if (ca.includes(cb) || cb.includes(ca)) return true
    // Word overlap: if 2+ words match, consider it a match
    const wordsA = ca.split(/\s+/).filter(w => w.length > 2)
    const wordsB = cb.split(/\s+/).filter(w => w.length > 2)
    const overlap = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)))
    return overlap.length >= 2
  }

  // Schools Dalia completed visits at
  const completedVisitSchools = [...new Set(
    allVisits.filter(v => completions[v.id]).map(v => v.school_name).filter(Boolean)
  )]

  // How many of those schools appear in completed applicants
  const matchedSchools = completedVisitSchools.filter(visitSchool =>
    completedApplicantSchools.some(appSchool => fuzzyMatch(visitSchool, appSchool))
  )

  const PIPELINE_VISITS = [
    { label: 'Leads', value: stats.totalVisitStudents, sub: 'collected at visits', accent: '#f59e0b', href: '/dashboard/visit-students' },
    { label: 'Matched', value: stats.matchedApplicants, sub: 'linked to an application', accent: '#6366f1', href: '/dashboard/visit-students' },
  ]
  const PIPELINE_APPLICANTS = [
    { label: 'Applicants', value: stats.totalApplicants + stats.completedApplicants, sub: 'total received', accent: '#3b82f6', href: '/dashboard/applicants/pending' },
    { label: 'Completed', value: stats.completedApplicants, sub: 'fully processed', accent: '#10b981', href: '/dashboard/applicants/completed' },
  ]

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Dalia'} 
            <Heart size={20} color="#ef4444" fill="#ef4444" /> 
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {dailyTip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)', width: 'fit-content', boxShadow: '0 0 0 1px rgba(139,92,246,0.15)', animation: 'tipGlow 3s ease-in-out infinite' }}>
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
      

      {/* ── Top Row: Pipeline + Mini Tasks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* ── Conversion Pipeline ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 28px' }}>

          {/* 3 Liquid Ball Funnels */}
          {[
            {
              title: 'Recruitment Funnel',
              stages: PIPELINE_VISITS,
              clipId: 'clip1', gradId: 'grad1', glowId: 'glow1'
            },
            {
              title: 'Admissions Funnel',
              stages: PIPELINE_APPLICANTS,
              clipId: 'clip2', gradId: 'grad2', glowId: 'glow2'
            },
            {
              title: 'Visit-to-Admission Impact',
              stages: [
                { label: 'Schools Visited', value: completedVisitSchools.length, sub: 'completed visits', accent: '#8b5cf6', href: '/dashboard/school-visits' },
                { label: 'Schools Converted', value: matchedSchools.length, sub: 'produced admissions', accent: '#10b981', href: '/dashboard/applicants/completed' },
              ],
              clipId: 'clip3', gradId: 'grad3', glowId: 'glow3'
            },
          ].map(({ title, stages, clipId, gradId, glowId }) => {
            const convPct = stages[0].value > 0 ? Math.round((stages[1].value / stages[0].value) * 100) : 0

            const LiquidBall = ({ stage, uid }) => {
              const maxVal = stages[0].value
              const pct = maxVal > 0 ? Math.min((stage.value / maxVal) * 100, 100) : 0
              const waveY = pct === 0 ? 100 : (100 - pct)
              const accent = stage.accent
              const cid = `${uid}_clip`
              const gid = `${uid}_glow`

              return (
                <Link href={stage.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative', width: '110px', height: '110px', transition: 'transform 0.2s' }}>
                      <svg width="110" height="110" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                        <defs>
                          <clipPath id={cid}><circle cx="55" cy="55" r="46" /></clipPath>
                          <radialGradient id={gid} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        {/* Outer glow ring */}
                        <circle cx="55" cy="55" r="52" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.15" />
                        {/* Border */}
                        <circle cx="55" cy="55" r="46" fill="rgba(255,255,255,0.02)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" />
                        {/* Liquid */}
                        <g clipPath={`url(#${cid})`}>
                          <rect x="0" y={`${waveY}%`} width="110" height="110"
                            fill={accent} fillOpacity="0.15"
                            style={{ transition: 'y 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                          />
                          <g style={{ animation: 'liquidWave1 3s ease-in-out infinite' }}>
                            <path
                              d={`M-55,${waveY * 1.1} C-27,${waveY * 1.1 - 7} 0,${waveY * 1.1 + 7} 27,${waveY * 1.1} C55,${waveY * 1.1 - 7} 82,${waveY * 1.1 + 7} 110,${waveY * 1.1} C138,${waveY * 1.1 - 7} 165,${waveY * 1.1 + 7} 192,${waveY * 1.1} L192,220 L-55,220 Z`}
                              fill={accent} fillOpacity="0.35"
                            />
                          </g>
                          <g style={{ animation: 'liquidWave2 4s ease-in-out infinite' }}>
                            <path
                              d={`M-55,${waveY * 1.1 + 5} C-27,${waveY * 1.1 + 5 + 6} 0,${waveY * 1.1 + 5 - 6} 27,${waveY * 1.1 + 5} C55,${waveY * 1.1 + 5 + 6} 82,${waveY * 1.1 + 5 - 6} 110,${waveY * 1.1 + 5} C138,${waveY * 1.1 + 5 + 6} 165,${waveY * 1.1 + 5 - 6} 192,${waveY * 1.1 + 5} L192,220 L-55,220 Z`}
                              fill={accent} fillOpacity="0.2"
                            />
                          </g>
                          {/* Shimmer */}
                          <ellipse cx="38" cy="32" rx="10" ry="6" fill="rgba(255,255,255,0.08)"
                            style={{ animation: 'shimmerPulse 3s ease-in-out infinite' }}
                          />
                        </g>
                        <circle cx="55" cy="55" r="46" fill={`url(#${gid})`} />
                      </svg>
                      {/* Center text */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1', textShadow: `0 0 14px ${accent}` }}>
                          {stage.value.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: accent, marginTop: '3px', textShadow: `0 0 8px ${accent}` }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: accent }}>{stage.label}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{stage.sub}</p>
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <div key={title} style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px 0' }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LiquidBall stage={stages[0]} uid={`${clipId}_a`} />

                  {/* Flow connector */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: convPct >= 50 ? '#10b981' : convPct >= 25 ? '#fbbf24' : '#f87171' }}>
                      {convPct}%
                    </span>
                    <div style={{ width: '100%', position: 'relative', height: '6px', display: 'flex', alignItems: 'center' }}>
                      {/* Flowing dots animation */}
                      <div style={{ width: '100%', height: '2px', background: `linear-gradient(90deg, ${stages[0].accent}40, ${stages[1].accent}40)`, borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(90deg, transparent 0%, ${stages[1].accent} 50%, transparent 100%)`, animation: 'flowDot 2s linear infinite' }} />
                      </div>
                      <div style={{ position: 'absolute', right: '-4px', width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `7px solid ${stages[1].accent}60` }} />
                    </div>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>conversion</span>
                  </div>

                  <LiquidBall stage={stages[1]} uid={`${clipId}_b`} />
                </div>
              </div>
            )
          })}

          {/* ── This Month vs Last Month ── */}
          {(() => {
            const now = new Date()
            const thisMonth = now.getMonth()
            const thisYear = now.getFullYear()
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
            const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

            const thisMonthVisits = allVisits.filter(v => {
              if (!v.visit_date || v.is_cancelled) return false
              const d = new Date(v.visit_date)
              return d.getMonth() === thisMonth && d.getFullYear() === thisYear
            })
            const lastMonthVisits = allVisits.filter(v => {
              if (!v.visit_date || v.is_cancelled) return false
              const d = new Date(v.visit_date)
              return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
            })

            const thisMonthCompleted = thisMonthVisits.filter(v => completions[v.id]).length
            const lastMonthCompleted = lastMonthVisits.filter(v => completions[v.id]).length
            const thisMonthName = now.toLocaleDateString('en-US', { month: 'short' })
            const lastMonthName = new Date(lastMonthYear, lastMonth).toLocaleDateString('en-US', { month: 'short' })

            const maxVal = Math.max(thisMonthCompleted, lastMonthCompleted, 1)
            const thisPct = Math.round((thisMonthCompleted / maxVal) * 100)
            const lastPct = Math.round((lastMonthCompleted / maxVal) * 100)
            const isUp = thisMonthCompleted >= lastMonthCompleted

            const MonthBall = ({ value, pct, label, accent, uid }) => {
              const waveY = pct === 0 ? 100 : (100 - pct)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <svg width="90" height="90" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                      <defs>
                        <clipPath id={`${uid}_clip`}><circle cx="45" cy="45" r="38" /></clipPath>
                        <radialGradient id={`${uid}_glow`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <circle cx="45" cy="45" r="43" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.12" />
                      <circle cx="45" cy="45" r="38" fill="rgba(255,255,255,0.02)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.35" />
                      <g clipPath={`url(#${uid}_clip)`}>
                        <rect x="0" y={`${waveY}%`} width="90" height="90" fill={accent} fillOpacity="0.15"
                          style={{ transition: 'y 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
                        <g style={{ animation: 'liquidWave1 3s ease-in-out infinite' }}>
                          <path d={`M-45,${waveY * 0.9} C-22,${waveY * 0.9 - 6} 0,${waveY * 0.9 + 6} 22,${waveY * 0.9} C45,${waveY * 0.9 - 6} 67,${waveY * 0.9 + 6} 90,${waveY * 0.9} C112,${waveY * 0.9 - 6} 135,${waveY * 0.9 + 6} 157,${waveY * 0.9} L157,180 L-45,180 Z`}
                            fill={accent} fillOpacity="0.35" />
                        </g>
                        <g style={{ animation: 'liquidWave2 4s ease-in-out infinite' }}>
                          <path d={`M-45,${waveY * 0.9 + 4} C-22,${waveY * 0.9 + 10} 0,${waveY * 0.9 - 2} 22,${waveY * 0.9 + 4} C45,${waveY * 0.9 + 10} 67,${waveY * 0.9 - 2} 90,${waveY * 0.9 + 4} C112,${waveY * 0.9 + 10} 135,${waveY * 0.9 - 2} 157,${waveY * 0.9 + 4} L157,180 L-45,180 Z`}
                            fill={accent} fillOpacity="0.2" />
                        </g>
                        <ellipse cx="30" cy="26" rx="8" ry="5" fill="rgba(255,255,255,0.08)" style={{ animation: 'shimmerPulse 3s ease-in-out infinite' }} />
                      </g>
                      <circle cx="45" cy="45" r="38" fill={`url(#${uid}_glow)`} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1', textShadow: `0 0 12px ${accent}` }}>{value}</span>
                      <span style={{ fontSize: '9px', fontWeight: '600', color: accent, marginTop: '2px' }}>{pct}%</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                </div>
              )
            }

            return (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', paddingTop: '18px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0', textAlign: 'center' }}>
                  {thisMonthName} vs {lastMonthName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                  <MonthBall value={thisMonthCompleted} pct={thisPct} label={thisMonthName} accent="#3b82f6" uid="thismonth" />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{isUp ? '📈' : '📉'}</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: isUp ? '#10b981' : '#f87171' }}>
                      {isUp ? '+' : ''}{thisMonthCompleted - lastMonthCompleted}
                    </span>
                  </div>
                  <MonthBall value={lastMonthCompleted} pct={lastPct} label={lastMonthName} accent="#6366f1" uid="lastmonth" />
                </div>
              </div>
            )
          })()}
        </div>

        {/* ── Mini Tasks Widget ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Quick Tasks</h2>
            </div>
            <Link href="/dashboard/tasks" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}>View all →</Link>
          </div>

          {/* Quick add */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={quickTask}
              onChange={e => setQuickTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleQuickAddTask())}
              placeholder="Add a quick task..."
              rows={2}
              dir="auto"
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#ffffff', outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: '1.5' }}
            />
            <input
              type="date"
              value={quickDue}
              onChange={e => setQuickDue(e.target.value)}
              style={{ width: '110px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#ffffff', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleQuickAddTask}
              disabled={addingTask}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', color: '#ffffff', cursor: addingTask ? 'not-allowed' : 'pointer', opacity: addingTask ? 0.6 : 1 }}
            >
              +
            </button>
          </div>

          {/* Task list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                No pending tasks 🎉
              </div>
            ) : (
              tasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                const isDueToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString()
                const isDueSoon = task.due_date && !isOverdue && !isDueToday && (new Date(task.due_date) - new Date()) < 1000 * 60 * 60 * 48
                const isCompleting = completingTask === task.id
                const accent = isOverdue ? '#f87171' : isDueToday ? '#fbbf24' : isDueSoon ? '#fb923c' : '#10b981'
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: isCompleting ? `rgba(16,185,129,0.08)` : isOverdue ? 'rgba(248,113,113,0.05)' : isDueToday ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCompleting ? 'rgba(16,185,129,0.3)' : isOverdue ? 'rgba(248,113,113,0.15)' : isDueToday ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.3s',
                    opacity: isCompleting ? 0.6 : 1,
                    transform: isCompleting ? 'scale(0.98)' : 'scale(1)',
                  }}>
                    <button
                      onClick={() => handleCompleteTask(task)}
                      disabled={isCompleting}
                      style={{
                        background: isCompleting ? '#10b981' : 'none',
                        border: `1px solid ${isCompleting ? '#10b981' : accent}`,
                        borderRadius: '50%', width: '16px', height: '16px',
                        cursor: isCompleting ? 'not-allowed' : 'pointer',
                        padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                        animation: isCompleting ? 'taskComplete 0.6s ease-in-out' : 'none',
                      }}
                    >
                      <CheckCircle size={10} color={isCompleting ? '#ffffff' : 'transparent'} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '12px', color: isCompleting ? 'rgba(255,255,255,0.4)' : '#ffffff',
                        margin: '0 0 2px 0', wordBreak: 'break-word',
                        textDecoration: isCompleting ? 'line-through' : 'none',
                        transition: 'all 0.3s',
                      }}>{task.title}</p>
                      {task.due_date && (
                        <p style={{ fontSize: '10px', color: isOverdue ? '#f87171' : isDueToday ? '#fbbf24' : isDueSoon ? '#fb923c' : 'rgba(255,255,255,0.3)', margin: 0 }}>
                          {isOverdue ? '⚠ Overdue · ' : isDueToday ? '📅 Due today · ' : isDueSoon ? '⏰ Due soon · ' : ''}{task.due_date}
                        </p>
                      )}
                    </div>
                    {!isCompleting && (
                      <button
                        onClick={() => {
                          window.location.href = '/dashboard/tasks'
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '2px', flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                        title="Edit task"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    {isCompleting && <span style={{ fontSize: '14px', animation: 'bounce 0.6s ease-in-out' }}>✓</span>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Conversion Pipeline ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 28px' }}>
        {(() => {
          const goal = 100
          const current = completedVisitSchools.length
          const pct = Math.min((current / goal) * 100, 100)
          const isComplete = current >= goal
          const waveOffset = pct === 0 ? 100 : (100 - pct)

          return (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Annual Goal</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
                    {isComplete ? '🎉 Goal Reached!' : 'School Visit Goal'}
                  </p>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  {isComplete ? 'Amazing work, Dalia!' : 'Keep it up!'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>

                {/* Liquid Ball */}
                <div style={{ flexShrink: 0, position: 'relative', width: '180px', height: '180px' }}>
                  <svg width="180" height="180" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <defs>
                      <clipPath id="circleClip">
                        <circle cx="90" cy="90" r="78" />
                      </clipPath>
                      <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={isComplete ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)'} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </radialGradient>
                    </defs>

                    {/* Outer ring glow */}
                    <circle cx="90" cy="90" r="84" fill="none"
                      stroke={isComplete ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}
                      strokeWidth="2"
                    />
                    {/* Main circle border */}
                    <circle cx="90" cy="90" r="78" fill="rgba(255,255,255,0.03)"
                      stroke={isComplete ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.5)'}
                      strokeWidth="2"
                    />

                    {/* Liquid fill group — clipped to circle */}
                    <g clipPath="url(#circleClip)">
                      {/* Liquid background */}
                      <rect
                        x="0" y={`${waveOffset}%`} width="180" height="180"
                        fill={isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.2)'}
                        style={{ transition: 'y 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                      />

                      {/* Wave 1 — foreground */}
                      <g style={{ animation: 'liquidWave1 3s ease-in-out infinite' }}>
                        <path
                          d={`M-90,${waveOffset * 1.8} 
                             C-45,${waveOffset * 1.8 - 12} 0,${waveOffset * 1.8 + 12} 45,${waveOffset * 1.8}
                             C90,${waveOffset * 1.8 - 12} 135,${waveOffset * 1.8 + 12} 180,${waveOffset * 1.8}
                             C225,${waveOffset * 1.8 - 12} 270,${waveOffset * 1.8 + 12} 315,${waveOffset * 1.8}
                             L315,360 L-90,360 Z`}
                          fill={isComplete ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.45)'}
                          style={{ transition: 'd 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                        />
                      </g>

                      {/* Wave 2 — background, offset phase */}
                      <g style={{ animation: 'liquidWave2 4s ease-in-out infinite' }}>
                        <path
                          d={`M-90,${waveOffset * 1.8 + 8}
                             C-45,${waveOffset * 1.8 + 8 + 10} 0,${waveOffset * 1.8 + 8 - 10} 45,${waveOffset * 1.8 + 8}
                             C90,${waveOffset * 1.8 + 8 + 10} 135,${waveOffset * 1.8 + 8 - 10} 180,${waveOffset * 1.8 + 8}
                             C225,${waveOffset * 1.8 + 8 + 10} 270,${waveOffset * 1.8 + 8 - 10} 315,${waveOffset * 1.8 + 8}
                             L315,360 L-90,360 Z`}
                          fill={isComplete ? 'rgba(110,231,183,0.3)' : 'rgba(253,224,71,0.3)'}
                          style={{ transition: 'd 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                        />
                      </g>

                      {/* Shimmer highlight */}
                      <ellipse cx="65" cy="55" rx="18" ry="10"
                        fill="rgba(255,255,255,0.07)"
                        style={{ animation: 'shimmerPulse 3s ease-in-out infinite' }}
                      />
                    </g>

                    {/* Radial glow overlay */}
                    <circle cx="90" cy="90" r="78" fill="url(#ballGlow)" />
                  </svg>

                  {/* Center text overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: '38px', fontWeight: '800', color: '#ffffff', letterSpacing: '-2px', lineHeight: '1', textShadow: `0 0 20px ${isComplete ? '#34d399' : '#fbbf24'}` }}>
                      {current}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>of {goal}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: isComplete ? '#34d399' : '#fbbf24', marginTop: '4px', textShadow: `0 0 10px ${isComplete ? '#34d399' : '#fbbf24'}` }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                </div>

                {/* Milestone pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {[25, 50, 75, 100].map(milestone => {
                    const reached = current >= milestone
                    return (
                      <div key={milestone} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', borderRadius: '12px',
                        background: reached ? (milestone === 100 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${reached ? (milestone === 100 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.04)'}`,
                        transition: 'all 0.3s',
                      }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
                          background: reached ? (milestone === 100 ? '#10b981' : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.04)',
                          color: reached ? '#ffffff' : 'rgba(255,255,255,0.2)',
                          fontWeight: '700',
                        }}>
                          {reached ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: reached ? (milestone === 100 ? '#34d399' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.2)' }}>
                            {milestone === 100 ? '🎯 Goal' : `${milestone} visits`}
                          </p>
                        </div>
                        {reached && (
                          <span style={{ fontSize: '10px', color: milestone === 100 ? '#34d399' : 'rgba(255,255,255,0.3)', fontWeight: '600' }}>✓ Reached</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
{/* ── Today's Battlefield ── */}
      {(() => {
        const todayVisits = allVisits.filter(v =>
          v.visit_date?.slice(0, 10) === todayStr && !v.is_cancelled
        )

        const now = new Date()

        const getTimeStatus = (timeStr) => {
          if (!timeStr) return null
          const [h, m] = timeStr.split(':').map(Number)
          const visitMinutes = h * 60 + m
          const nowMinutes = now.getHours() * 60 + now.getMinutes()
          const diff = visitMinutes - nowMinutes
          if (diff > 0) {
            if (diff < 60) return { label: `in ${diff}m`, urgent: true, past: false }
            return { label: `in ${Math.round(diff / 60)}h ${diff % 60 > 0 ? (diff % 60) + 'm' : ''}`.trim(), urgent: diff < 120, past: false }
          } else {
            const ago = Math.abs(diff)
            if (ago < 60) return { label: `started ${ago}m ago`, urgent: false, past: true }
            return { label: `started ${Math.round(ago / 60)}h ago`, urgent: false, past: true }
          }
        }

        if (todayVisits.length === 0) return (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>No visits today</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Enjoy the breathing room — use it to follow up on pending applicants.</p>
            </div>
          </div>
        )

        return (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', animation: 'pulse 2s ease-in-out infinite' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Today's Battlefield</h2>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
                {todayVisits.length} visit{todayVisits.length > 1 ? 's' : ''} scheduled
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: '32px' }}>

              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: '11px', top: '8px',
                width: '2px',
                height: `calc(100% - 16px)`,
                background: 'linear-gradient(180deg, rgba(239,68,68,0.6) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: '2px',
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {todayVisits
                  .sort((a, b) => (a.visit_time || '99:99').localeCompare(b.visit_time || '99:99'))
                  .map((visit, index) => {
                    const timeStatus = getTimeStatus(visit.visit_time)
                    const isDone = !!completions[visit.id]
                    const qrSent = visit.qr_sent
                    const isUrgent = timeStatus?.urgent && !isDone
                    const isPast = timeStatus?.past && !isDone

                    const dotColor = isDone ? '#10b981' : isPast ? '#ef4444' : isUrgent ? '#fbbf24' : '#8b5cf6'

                    const actions = []
                    if (!isDone && !qrSent) actions.push({ text: "QR not sent to counselor yet", color: '#f59e0b', icon: '⚠️' })
                    if (!isDone && qrSent) actions.push({ text: "QR sent — waiting for students to register", color: '#10b981', icon: '✅' })
                    if (!isDone && isPast) actions.push({ text: "Visit time passed — don't forget to mark it complete", color: '#ef4444', icon: '🔴' })
                    if (isDone) actions.push({ text: "Visit marked complete", color: '#10b981', icon: '✓' })

                    return (
                      <div key={visit.id} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>

                        {/* Timeline dot */}
                        <div style={{
                          position: 'absolute', left: '-25px', top: '10px',
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: dotColor,
                          boxShadow: `0 0 ${isUrgent ? '10px' : '6px'} ${dotColor}`,
                          border: '2px solid #0f1115',
                          flexShrink: 0,
                          animation: isUrgent ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          zIndex: 1,
                        }} />

                        {/* Card */}
                        <div style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: isDone
                            ? 'rgba(16,185,129,0.06)'
                            : isPast ? 'rgba(239,68,68,0.07)'
                            : isUrgent ? 'rgba(245,158,11,0.07)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isDone
                            ? 'rgba(16,185,129,0.2)'
                            : isPast ? 'rgba(239,68,68,0.25)'
                            : isUrgent ? 'rgba(245,158,11,0.25)'
                            : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.3s',
                          animation: isUrgent ? 'urgentPulse 2s ease-in-out infinite' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ flex: 1 }}>

                              {/* Time + school name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                {visit.visit_time && (
                                  <span style={{
                                    fontSize: '11px', fontWeight: '700',
                                    color: dotColor,
                                    fontVariantNumeric: 'tabular-nums',
                                    textShadow: `0 0 8px ${dotColor}`,
                                  }}>{visit.visit_time}</span>
                                )}
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{visit.school_name}</span>
                                {timeStatus && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                                    background: isPast ? 'rgba(239,68,68,0.15)' : isUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                                    color: isPast ? '#f87171' : isUrgent ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                                  }}>{timeStatus.label}</span>
                                )}
                              </div>

                              {/* Actions */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {actions.map((a, i) => (
                                  <p key={i} style={{ fontSize: '11px', color: a.color, margin: 0, opacity: 0.85 }}>
                                    {a.icon} {a.text}
                                  </p>
                                ))}
                              </div>
                            </div>

                            {!isDone && (
                              <a href="/dashboard/school-visits" style={{
                                fontSize: '11px', color: '#3b82f6', textDecoration: 'none',
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap', flexShrink: 0,
                              }}>Go →</a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )
      })()}
      {/* ── Bottom Grid: Agenda + Map ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>

        {/* ── Visit Calendar ── */}
        <div style={card}>
          <VisitCalendar allVisits={allVisits} completions={completions} todayStr={todayStr} />
        </div>

        {/* ── Geographic Visit Map ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '520px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={15} color="#60a5fa" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>School Visit Coverage Map</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Real-time school visit tracking</span>
                </div>
              </div>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(59,130,246,0.8)', background: 'rgba(59,130,246,0.15)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.2)' }}>
  {allVisits.filter(v => v.lat && v.lng && completions[v.id]).length} mapped
</span>
          </div>
          
          <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
             <VisitsMap visits={allVisits} completions={completions} />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0) }
          30% { transform: translateY(-5px) }
        }
        @keyframes liquidWave1 {
          0%, 100% { transform: translateX(0px) }
          50% { transform: translateX(-45px) }
        }
        @keyframes liquidWave2 {
          0%, 100% { transform: translateX(-45px) }
          50% { transform: translateX(0px) }
        }
        @keyframes shimmerPulse {
          0%, 100% { opacity: 0.5 }
          50% { opacity: 1 }
        }
        @keyframes flowDot {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
        @keyframes tipGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(139,92,246,0.15), 0 0 8px rgba(139,92,246,0.1); }
          50% { box-shadow: 0 0 0 1px rgba(139,92,246,0.4), 0 0 16px rgba(139,92,246,0.25); }
        }
        @keyframes taskComplete {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); background: #10b981; }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 0 12px rgba(245,158,11,0.2); }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}