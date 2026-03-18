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
  LogOut
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'School Visits', href: '/dashboard/school-visits', icon: School },
  { label: 'Visit Students', href: '/dashboard/visit-students', icon: Users },
  { label: 'Applicants', href: '/dashboard/applicants', icon: ClipboardList },
  { label: 'Contacts', href: '/dashboard/contacts', icon: BookUser },
  { label: 'Tasks & Reminders', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messaging', href: '/dashboard/messaging', icon: MessageSquare },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
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

  return (
    <div style={{
      height: '100vh',
      width: '240px',
      background: 'linear-gradient(180deg, #0f0f13 0%, #1a1a2e 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>HTU CRM</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Outreach Office</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.35)' }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: '13px',
            fontWeight: '400',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.color = '#f87171'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}