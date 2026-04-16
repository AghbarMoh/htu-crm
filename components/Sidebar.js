'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  School,
  Users,
  ClipboardList,
  BookUser,
  CalendarCheck,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  Archive,
  Activity
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'School Visits', href: '/dashboard/school-visits', icon: School },
  { label: 'Visit Students', href: '/dashboard/visit-students', icon: Users },
  { label: 'Applicants', href: '/dashboard/applicants', icon: ClipboardList },
  { label: 'Archive', href: '/dashboard/archive', icon: Archive },
  { label: 'Contacts', href: '/dashboard/contacts', icon: BookUser },
  { label: 'Tasks & Reminders', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messaging', href: '/dashboard/messaging', icon: MessageSquare },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { label: 'Activity Log', href: '/dashboard/activity', icon: Activity },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const s = {
    container: {
      height: '100vh',
      width: '240px',
      background: '#0f0f13', // Deep matte background
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    },
    navLink: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      borderRadius: '12px',
      marginBottom: '4px',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // Dynamic Styles
      background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
      border: isActive ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
      color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.45)',
    })
  }

  return (
    <aside style={s.container}>
      {/* Logo Section */}
      <div style={{ padding: '24px 20px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(59,130,246,0.2)'
          }}>
            <Activity size={18} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>HTU CRM</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>Students Recruitment & Outreach Office</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 12px', scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              style={s.navLink(isActive)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.border = '1px solid transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                }
              }}
            >
              <Icon size={17} style={{ 
                color: isActive ? '#3b82f6' : 'inherit',
                transition: 'color 0.2s'
              }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out Section */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
            borderRadius: '12px', width: '100%', border: '1px solid transparent',
            background: 'transparent', fontSize: '13px', fontWeight: '500',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.border = '1px solid rgba(239,68,68,0.2)'
            e.currentTarget.style.color = '#f87171'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.border = '1px solid transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
          }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}