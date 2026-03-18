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
  const [recentApplicants, setRecentApplicants] = useState([])
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

    const [a, v, vs, c, tasks, recent] = await Promise.all([
      supabase.from('applicants').select('id, paid, is_matched'),
      supabase.from('school_visits').select('id'),
      supabase.from('visit_students').select('id'),
      supabase.from('contacts').select('id'),
      supabase.from('tasks').select('*').eq('is_done', false).order('due_date'),
      supabase.from('applicants').select('full_name, major, paid, imported_at').order('imported_at', { ascending: false }).limit(5),
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

    if (!recent.error) setRecentApplicants(recent.data)
    setLoading(false)
  }

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
    { label: 'Paid', value: stats.paidApplicants, icon: CheckCircle, color: '#10b981', href: '/dashboard/applicants' },
    { label: 'School Visits', value: stats.totalVisits, icon: School, color: '#8b5cf6', href: '/dashboard/school-visits' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                      {task.due_date && <p style={{ fontSize: '11px', color: isOverdue(task.due_date) ? '#ef4444' : 'rgba(255,255,255,0.25)', margin: 0 }}>{isOverdue(task.due_date) ? 'Overdue: ' : 'Due: '}{task.due_date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Applicants */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Recent Applicants</h2>
            <Link href="/dashboard/applicants" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>View all</Link>
          </div>
          {recentApplicants.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>No applicants yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentApplicants.map((applicant, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#ffffff', margin: '0 0 2px 0' }}>{applicant.full_name}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{applicant.major || 'No major'}</p>
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: applicant.paid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: applicant.paid ? '#10b981' : '#ef4444',
                  }}>
                    {applicant.paid ? 'Paid' : 'Not Paid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}