'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { School, Users, ClipboardList, BookUser, CalendarCheck, CheckCircle, Circle } from 'lucide-react'
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
  const [upcomingVisits, setUpcomingVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
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

    const [a, v, vs, c, tasks, upcoming] = await Promise.all([
     supabase.from('applicants').select('id, paid, is_matched').eq('is_archived', false),
      supabase.from('visit_completions').select('id'),
      supabase.from('visit_students').select('id'),
      supabase.from('contacts').select('id'),
      supabase.from('tasks').select('*').eq('is_done', false).order('due_date'),
      supabase.from('school_visits').select('*').gte('visit_date', today).order('visit_date', { ascending: true }).limit(4),
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

   if (!upcoming.error) setUpcomingVisits(upcoming.data)
    setLoading(false)
  } // <-- ADDED MISSING CLOSING BRACE HERE

  const handleCompleteTask = async (id) => {
    await supabase.from('tasks').update({ is_done: true }).eq('id', id)
    fetchAll()
  }

  const isOverdue = (date) => date && new Date(date) < new Date()

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
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: stat.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{task.description}</p>
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
                      <p style={{ fontSize: '11px', color: isOverdue(task.due_date) ? '#ef4444' : 'rgba(255,255,255,0.25)', margin: 0 }}>{isOverdue(task.due_date) ? 'Overdue: ' : 'Due: '}{task.due_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
            {/* Upcoming School Visits */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Upcoming Visits</h2>
            <Link href="/dashboard/school-visits" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none' }}>View all</Link>
          </div>
          {upcomingVisits.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>No upcoming visits scheduled</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingVisits.map((visit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    
                    {/* Calendar Date Icon */}
                    <div style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '45px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>
                        {new Date(visit.visit_date).getDate()}
                      </span>
                    </div>

                    {/* Visit Info */}
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>{visit.school_name}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        {visit.visit_time ? `${visit.visit_time} • ` : ''}{visit.type}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div> 
  )
}