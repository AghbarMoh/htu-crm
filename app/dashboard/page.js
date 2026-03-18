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
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Good morning, {user?.full_name?.split(' ')[0] || 'Dalia'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Applicants', value: stats.totalApplicants, icon: ClipboardList, color: 'text-blue-600 bg-blue-50', href: '/dashboard/applicants' },
          { label: 'Paid', value: stats.paidApplicants, icon: CheckCircle, color: 'text-green-600 bg-green-50', href: '/dashboard/applicants' },
          { label: 'School Visits', value: stats.totalVisits, icon: School, color: 'text-purple-600 bg-purple-50', href: '/dashboard/school-visits' },
          { label: 'Visit Students', value: stats.totalVisitStudents, icon: Users, color: 'text-orange-600 bg-orange-50', href: '/dashboard/visit-students' },
          { label: 'Matched', value: stats.matchedApplicants, icon: CheckCircle, color: 'text-indigo-600 bg-indigo-50', href: '/dashboard/applicants' },
          { label: 'Contacts', value: stats.totalContacts, icon: BookUser, color: 'text-pink-600 bg-pink-50', href: '/dashboard/contacts' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                  <div className={"p-3 rounded-xl " + stat.color}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Today's Tasks</h2>
            <Link href="/dashboard/tasks" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No tasks for today</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="text-gray-300 hover:text-green-500 transition"
                  >
                    <Circle size={18} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-400">{task.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Tasks */}
          {pendingTasks.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Upcoming</p>
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <Circle size={16} className={"flex-shrink-0 " + (isOverdue(task.due_date) ? 'text-red-400' : 'text-gray-300')} />
                    <div>
                      <p className="text-sm text-gray-700">{task.title}</p>
                      {task.due_date && (
                        <p className={"text-xs " + (isOverdue(task.due_date) ? 'text-red-400' : 'text-gray-400')}>
                          {isOverdue(task.due_date) ? 'Overdue: ' : 'Due: '}{task.due_date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Applicants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent Applicants</h2>
            <Link href="/dashboard/applicants" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentApplicants.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No applicants yet</p>
          ) : (
            <div className="space-y-2">
              {recentApplicants.map((applicant, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{applicant.full_name}</p>
                    <p className="text-xs text-gray-400">{applicant.major || 'No major'}</p>
                  </div>
                  <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (applicant.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
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