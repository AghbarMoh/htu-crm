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

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalApplicants: 0, completedApplicants: 0, totalVisits: 0, totalContacts: 0, totalVisitStudents: 0, matchedApplicants: 0 })
  const [allVisits, setAllVisits] = useState([])
  const [completedApplicantSchools, setCompletedApplicantSchools] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
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

  const todayStr = new Date().toISOString().split('T')[0]

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
      

      {/* ── Conversion Pipeline ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 28px' }}>
{[
          { title: 'Recruitement Funnel', pipeline: PIPELINE_VISITS },
          { title: 'Admissions Funnel', pipeline: PIPELINE_APPLICANTS },
          { title: 'Visit-to-Admission Impact', pipeline: [
            { label: 'Schools Visited', value: completedVisitSchools.length, sub: 'with completed visits', accent: '#8b5cf6', href: '/dashboard/school-visits' },
            { label: 'Schools Converted', value: matchedSchools.length, sub: 'produced completed admissions', accent: '#10b981', href: '/dashboard/applicants/completed' },
          ]},
        ].map(({ title, pipeline }) => (          <div key={title} style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px 0' }}>{title}</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
          {pipeline.map((stage, i) => {
            const next = pipeline[i + 1]
            const convPct = next && stage.value > 0 ? Math.round((next.value / stage.value) * 100) : null
            return (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: i < pipeline.length - 1 ? '1' : 'none' }}>
                {/* Stage */}
                <Link href={stage.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1.5px', background: `linear-gradient(135deg, #ffffff 30%, ${stage.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {stage.value.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: stage.accent, letterSpacing: '0.03em' }}>{stage.label}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: '100px', lineHeight: '1.4' }}>{stage.sub}</span>
                  </div>
                </Link>

                {/* Arrow + conversion rate */}
                {next && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                      {convPct !== null ? `${convPct}%` : '—'}
                    </span>
                    <div style={{ width: '100%', height: '2px', background: `linear-gradient(90deg, ${stage.accent}60, ${next.accent}60)`, borderRadius: '2px', position: 'relative', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '0', height: '0', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${next.accent}60` }} />
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}>conversion</span>
                  </div>
                )}
              </div>
            )
          })}
            </div>
          </div>
        ))}

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

          const visitDiff = lastMonthVisits.length === 0 ? null : Math.round(((thisMonthVisits.length - lastMonthVisits.length) / lastMonthVisits.length) * 100)
          const completedDiff = lastMonthCompleted === 0 ? null : Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)

          const Chip = ({ diff }) => {
            if (diff === null) return <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>no data</span>
            const up = diff >= 0
            return (
              <span style={{ fontSize: '10px', fontWeight: '700', color: up ? '#10b981' : '#f87171', background: up ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)', padding: '2px 7px', borderRadius: '20px' }}>
                {up ? '↑' : '↓'} {Math.abs(diff)}%
              </span>
            )
          }

          return (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {thisMonthName} vs {lastMonthName}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' }}>{thisMonthCompleted}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>vs {lastMonthCompleted} completed visits last month</span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
{/* ── Today's Battlefield ── */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0]
        const todayVisits = allVisits.filter(v =>
          v.visit_date === todayStr && !v.is_cancelled
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Today's Battlefield
              </h2>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
                {todayVisits.length} visit{todayVisits.length > 1 ? 's' : ''} scheduled
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayVisits.map(visit => {
                const timeStatus = getTimeStatus(visit.visit_time)
                const isDone = !!completions[visit.id]
                const qrSent = visit.qr_sent

                const actions = []
                if (!isDone && !qrSent) actions.push({ text: "QR not sent to counselor yet", color: '#f59e0b', icon: '⚠️' })
                if (!isDone && qrSent) actions.push({ text: "QR sent — waiting for students to register", color: '#10b981', icon: '✅' })
                if (!isDone && timeStatus?.past) actions.push({ text: "Visit time passed — don't forget to mark it complete", color: '#ef4444', icon: '🔴' })
                if (isDone) actions.push({ text: "Visit marked complete", color: '#10b981', icon: '✓' })

                return (
                  <div key={visit.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    background: isDone ? 'rgba(16,185,129,0.05)' : timeStatus?.urgent ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.15)' : timeStatus?.urgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{visit.school_name}</span>
                        {timeStatus && (
                          <span style={{
                            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                            background: timeStatus.past ? 'rgba(239,68,68,0.15)' : timeStatus.urgent ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.07)',
                            color: timeStatus.past ? '#f87171' : timeStatus.urgent ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                          }}>{timeStatus.label}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {actions.map((a, i) => (
                          <p key={i} style={{ fontSize: '12px', color: a.color, margin: 0, opacity: 0.85 }}>
                            {a.icon} {a.text}
                          </p>
                        ))}
                      </div>
                    </div>
                    {!isDone && (
                      <a href="/dashboard/school-visits" style={{
                        fontSize: '11px', color: '#3b82f6', textDecoration: 'none',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap', marginLeft: '12px'
                      }}>Go →</a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {/* ── Bottom Grid: Agenda + Map ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>

        {/* ── This Week Agenda ── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>This Week</h2>
            </div>
            <Link href="/dashboard/school-visits" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none', opacity: 0.8 }}>View all →</Link>
          </div>

          {(() => {
            const now = new Date()

            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(now)
              d.setDate(now.getDate() + i)
              const dateStr = d.toISOString().split('T')[0]
              const dayVisits = allVisits.filter(v => v.visit_date === dateStr && !v.is_cancelled)
              return { date: d, dateStr, dayVisits }
            })

            const hasAnyVisit = weekDays.some(d => d.dayVisits.length > 0)

            if (!hasAnyVisit) return (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '30px 0' }}>No visits scheduled this week.</p>
            )

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {weekDays.map(({ date, dateStr, dayVisits }) => {
                  const isToday = dateStr === todayStr
                  const isPast = date < new Date(now.toDateString())
                  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNum = date.getDate()

                  return (
                    <div key={dateStr} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '10px 12px', borderRadius: '10px',
                      background: isToday ? 'rgba(139,92,246,0.08)' : 'transparent',
                      border: isToday ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                      opacity: 1,
                    }}>
                      {/* Day label */}
                      <div style={{ width: '36px', flexShrink: 0, textAlign: 'center' }}>
                        <p style={{ fontSize: '10px', color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.3)', margin: '0 0 2px 0', fontWeight: '600', textTransform: 'uppercase' }}>{dayLabel}</p>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: isToday ? '#a78bfa' : 'rgba(255,255,255,0.5)', margin: 0 }}>{dayNum}</p>
                      </div>

                      {/* Visits or empty */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '2px' }}>
                        {dayVisits.length === 0 ? (
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', margin: 0, paddingTop: '4px' }}>—</p>
                        ) : dayVisits.map(visit => {
                          const done = !!completions[visit.id]
                          return (
                            <div key={visit.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '7px 10px', borderRadius: '8px',
                              background: done ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                            }}>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 1px 0' }}>{visit.school_name}</p>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                                  {visit.visit_time || ''}{visit.type ? ' · ' + visit.type : ''}
                                </p>
                              </div>
                              <span style={{
                                fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                                background: done ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                                color: done ? '#34d399' : '#a78bfa',
                                flexShrink: 0, marginLeft: '8px'
                              }}>{done ? '✓' : 'Pending'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* ── Geographic Visit Map ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '520px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={15} color="#60a5fa" />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Outreach Coverage Map</p>
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
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}