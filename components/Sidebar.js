'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase' // <-- Add this!

import {
  LayoutDashboard, School, Users, ClipboardList, BookUser,
  CalendarCheck, MessageSquare, BarChart2, Settings, LogOut,
  Archive, Activity
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'School Visits', href: '/dashboard/school-visits', icon: School },
  { label: 'Leads', href: '/dashboard/visit-students', icon: Users },  { label: 'Applicants', href: '/dashboard/applicants', icon: ClipboardList },
  { label: 'Archive', href: '/dashboard/archive', icon: Archive },
  { label: 'Contacts', href: '/dashboard/contacts', icon: BookUser },
  { label: 'Tasks & Reminders', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messaging', href: '/dashboard/messaging', icon: MessageSquare },
    { label: 'Market Analysis',  href: '/dashboard/market-analysis',icon: BarChart2},
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { label: 'Activity Log', href: '/dashboard/activity', icon: Activity },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient() // <-- Add this!
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh() // <-- Add this to clear Next.js client cache!
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="logo-zone">
        <div className="logo-mark">
          <Activity size={18} color="white" />
        </div>
        <div className="logo-name">HTU CRM</div>
        <div className="logo-sub">Students Recruitment & Outreach</div>
      </div>

      {/* Main Navigation */}
      <nav className="nav-section">
        <div className="nav-label">Main</div>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out Section */}
      <div className="nav-bottom">
        <button className="signout-btn" onClick={handleSignOut}>
          <LogOut className="nav-icon" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}