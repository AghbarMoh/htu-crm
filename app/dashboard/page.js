'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { School, Users, ClipboardList, BookUser, CalendarCheck, CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalApplicants: 0,
    paidApplicants: 0,
    totalVisits: 0,
    totalContacts: 0,
    totalVisitStudents: 0,
    matchedApplicants: 0,
  })
  const [todayTasks, setTodayTasks] = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [allVisits, setAllVisits] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAll()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionUser = sessionData?.session?.user
    if (sessionUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sessionUser.id)
        .single()
      setUser(profile)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [a, v, vs, c, tasks, visits, comps] = await Promise.all([
      supabase.from('applicants').select('id, paid, is_matched').eq('is_archived', false),
      supabase.from('visit_completions').select('id'),
      supabase.from('visit_students').select('id'),
      supabase.from('contacts').select('id'),
      supabase.from('tasks').select('*').eq('is_done', false).order('due_date'),
      supabase.from('school_visits').select('*').order('visit_date', { ascending: true }),
      supabase.from('visit_completions').select('*'),
    ])

    if (!a.error) {
      setStats({
        totalApplicants: a.data.length,
        paidApplicants: a.data.filter(x => x.paid).length,
        totalVisits: v.data?.length || 0,
        totalContacts: c.data?.length || 0,
        totalVisitStudents: vs.data?.length || 0,
        matchedApplicants: a.data.filter(x => x.is_matched).length,
      })
    }

    if (!tasks.error) {
      const todayList = tasks.data.filter(t => t.due_date === today)
      const pendingList = tasks.data.filter(t => t.due_date !== today).slice(0, 5)
      setTodayTasks(todayList)
      setPendingTasks(pendingList)
    }

    if (!visits.error) setAllVisits(visits.data)

    if (!comps.error) {
      const map = {}
      comps.data.forEach(c => { map[c.visit_id] = c })
      setCompletions(map)
    }

    setLoading(false)
  }

  const handleCompleteTask = async (id) => {
    await supabase.from('tasks').update({ is_done: true }).eq('id', id)
    fetchAll()
  }

  const isOverdue = (date) => date && new Date(date) < new Date()

  // ── Calendar helpers ────────────────────────────────────────────
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }
  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const visitsOnDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return allVisits.filter(v => v.visit_date === dateStr)
  }

  const selectedVisits = selectedDay ? visitsOnDay(selectedDay) : []

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr === todayStr
  }

  // ── Styles ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading dashboard...</p>
      </div>
    )
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '20px',
  }

  const statCards = [
    { label: 'Total Applicants', value: stats.totalApplicants, icon: ClipboardList, color: '#3b82f6', href: '/dashboard/applicants' },
    { label: 'Completed Visits', value: stats.totalVisits, icon: School, color: '#8b5cf6', href: '/dashboard/school-visits' },
    { label: 'Visit Students', value: stats.totalVisitStudents, icon: Users, color: '#f59e0b', href: '/dashboard/visit-students' },
    { label: 'Matched', value: stats.matchedApplicants, icon: CheckCircle, color: '#06b6d4', href: '/dashboard/applicants' },
    { label: 'Contacts', value: stats.totalContacts, icon: BookUser, color: '#ec4899', href: '/dashboard/contacts' },
  ]

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
          Good morning, {user?.full_name?.split(' ')[0] || 'Dalia'} 👋
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div style={{
                ...cardStyle,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>{stat.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{stat.label}</p>
                </div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: stat.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Today's Tasks */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Today's Tasks</h2>
            <Link href="/dashboard/tasks" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>View all</Link>
          </div>
          {todayTasks.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>No tasks for today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <button onClick={() => handleCompleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
                    <Circle size={16} />
                  </button>
                  <div>
                    <p style={{ fontSize: '13px', color: '#ffffff', margin: '0 0 2px 0' }}>{task.title}</p>
                    {task.description && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{task.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingTasks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Upcoming</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pendingTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '8px' }}>
                    <Circle size={14} style={{ color: isOverdue(task.due_date) ? '#ef4444' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 1px 0' }}>{task.title}</p>
                      <p style={{ fontSize: '11px', color: isOverdue(task.due_date) ? '#ef4444' : 'rgba(255,255,255,0.25)', margin: 0 }}>
                        {isOverdue(task.due_date) ? 'Overdue: ' : 'Due: '}{task.due_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div style={cardStyle}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Visit Calendar</h2>
            <Link href="/dashboard/school-visits" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none' }}>View all</Link>
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{monthName}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
            {days.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', padding: '4px 0', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={'empty-' + i} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayVisits = visitsOnDay(day)
              const hasVisit = dayVisits.length > 0
              const allDone = hasVisit && dayVisits.every(v => completions[v.id])
              const someDone = hasVisit && dayVisits.some(v => completions[v.id]) && !allDone
              const isSelected = selectedDay === day
              const today = isToday(day)

              return (
                <div
                  key={day}
                  onClick={() => hasVisit ? setSelectedDay(isSelected ? null : day) : null}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: '6px 2px',
                    borderRadius: '8px',
                    cursor: hasVisit ? 'pointer' : 'default',
                    background: isSelected
                      ? 'rgba(139,92,246,0.25)'
                      : today
                      ? 'rgba(59,130,246,0.15)'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(139,92,246,0.5)'
                      : today
                      ? '1px solid rgba(59,130,246,0.4)'
                      : '1px solid transparent',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (hasVisit && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (hasVisit && !isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{
                    fontSize: '12px',
                    fontWeight: today ? '700' : '400',
                    color: today ? '#60a5fa' : isSelected ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                  }}>
                    {day}
                  </span>

                  {/* Visit dot indicator */}
                  {hasVisit && (
                    <div style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: allDone ? '#10b981' : someDone ? '#f59e0b' : '#8b5cf6',
                      margin: '2px auto 0',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { color: '#8b5cf6', label: 'Pending' },
              { color: '#f59e0b', label: 'Partial' },
              { color: '#10b981', label: 'Done' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Selected day visits */}
          {selectedDay && selectedVisits.length > 0 && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', margin: '0 0 8px 0' }}>
                {selectedDay} {calendarDate.toLocaleDateString('en-US', { month: 'long' })} — {selectedVisits.length} visit{selectedVisits.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedVisits.map(visit => (
                  <div key={visit.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '8px',
                    background: completions[visit.id] ? 'rgba(16,185,129,0.08)' : 'rgba(139,92,246,0.08)',
                    border: '1px solid ' + (completions[visit.id] ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)'),
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>{visit.school_name}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {visit.visit_time ? visit.visit_time + ' • ' : ''}{visit.type}
                        {visit.companion ? ' • ' + visit.companion : ''}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: completions[visit.id] ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)',
                      color: completions[visit.id] ? '#10b981' : '#a78bfa',
                    }}>
                      {completions[visit.id] ? '✓ Done' : 'Pending'}
                    </span>
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