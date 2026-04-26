'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

import {
  LayoutDashboard, School, Users, ClipboardList, BookUser,
  CalendarCheck, MessageSquare, BarChart2, Settings, LogOut,
  Archive, Activity, FileText, Sun, Wallet, ChevronDown, Bot
} from 'lucide-react'

const navItemsEvents = [
  { label: 'Dashboard',             href: '/dashboard',                 icon: LayoutDashboard },
  { label: 'School Visits',         href: '/dashboard/school-visits',   icon: School },
  { label: 'Outreach Campaigns',    href: '/dashboard/outreach',        icon: Wallet },
]

const navItemsPipeline = [
  { label: 'Leads',  href: '/dashboard/visit-students',  icon: Users },
]

const navItemsTools = [
  { label: 'Tasks & Reminders',     href: '/dashboard/tasks',           icon: CalendarCheck },
  { label: 'Messaging',             href: '/dashboard/messaging',       icon: MessageSquare },
  { label: 'AI Assistant',          href: '/dashboard/ai-assistant',    icon: Bot },
  { label: 'Contacts',              href: '/dashboard/contacts',        icon: BookUser },
]

const navItemsAnalysis = [
  { label: 'Analytics',             href: '/dashboard/analytics',       icon: BarChart2 },
  { label: 'Market Analysis',       href: '/dashboard/market-analysis', icon: BarChart2 },
]

const navItemsAdminTop = [
  { label: 'Staff Companions',      href: '/dashboard/companions',      icon: Users },
]

const navItemsAdminBottom = [
  { label: 'Activity Log',          href: '/dashboard/activity',        icon: Activity },
  { label: 'Archive',               href: '/dashboard/archive',         icon: Archive },
  { label: 'Settings',              href: '/dashboard/settings',        icon: Settings },
]

const applicantsSubItems = [
  { label: 'Pending Applicants',   href: '/dashboard/applicants/pending' },
  { label: 'Completed Applicants', href: '/dashboard/applicants/completed' },
]

const sopSubItems = [
  { label: 'ISO Templates',        href: '/dashboard/sop' },
  { label: 'Open Days',            href: '/dashboard/sop/open-day' },
]

// Inline style that exactly replicates .nav-item for a <button>
// (buttons ignore the font/size/color cascade unless explicitly set)
const btnReset = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  padding: '8px 10px',
  borderRadius: '8px',
  marginBottom: '1px',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  transition: 'all 0.15s ease',
  border: '1px solid transparent',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  position: 'relative',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isApplicantsActive = pathname.startsWith('/dashboard/applicants')
  const [applicantsOpen, setApplicantsOpen] = useState(isApplicantsActive)
  const [btnHover, setBtnHover] = useState(false)
  
  const isSopActive = pathname.startsWith('/dashboard/sop')
  const [sopOpen, setSopOpen] = useState(isSopActive)
  const [sopHover, setSopHover] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const isActive = (href) => {
    if (href === '/dashboard/market-analysis') return pathname.startsWith(href)
    return pathname === href
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-zone">
        <div className="logo-mark">
          <Activity size={18} color="white" />
        </div>
        <div className="logo-name">HTU CRM</div>
        <div className="logo-sub">Students Recruitment & Outreach</div>
      </div>

      {/* Nav */}
      <nav className="nav-section">
        {/* 1. Events */}
        <div className="nav-label">Recruitment & Events</div>
        {navItemsEvents.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}

        {/* 2. Pipeline */}
        <div className="nav-label" style={{ marginTop: '16px' }}>Admissions Pipeline</div>
        {navItemsPipeline.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}

        {/* Applicants Dropdown */}
        <div style={{ marginBottom: '1px' }}>
          <button
            onClick={() => setApplicantsOpen(o => !o)}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              ...btnReset,
              ...(isApplicantsActive ? { background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: '1px solid rgba(79,142,247,0.2)', fontWeight: 500 } : btnHover ? { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' } : {}),
            }}
          >
            <ClipboardList style={{ width: '15px', height: '15px', flexShrink: 0, opacity: isApplicantsActive ? 1 : btnHover ? 0.85 : 0.6, transition: 'opacity 0.15s' }} />
            <span style={{ flex: 1 }}>Applicants</span>
            <ChevronDown size={12} style={{ transition: 'transform 0.2s ease', transform: applicantsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.4, flexShrink: 0 }} />
          </button>
          <div style={{ overflow: 'hidden', maxHeight: applicantsOpen ? '100px' : '0px', transition: 'max-height 0.22s ease' }}>
            {applicantsSubItems.map(({ href, label }) => (
              <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} style={{ paddingLeft: '34px', fontSize: '12px' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Tools */}
        <div className="nav-label" style={{ marginTop: '16px' }}>Execution Tools</div>
        {navItemsTools.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}

        {/* 4. Analysis */}
        <div className="nav-label" style={{ marginTop: '16px' }}>Strategy & Analytics</div>
        {navItemsAnalysis.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}

        {/* 5. Admin & SOP */}
        <div className="nav-label" style={{ marginTop: '16px' }}>Administration</div>
        {navItemsAdminTop.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}

        {/* SOP Dropdown */}
        <div style={{ marginBottom: '1px' }}>
          <button
            onClick={() => setSopOpen(o => !o)}
            onMouseEnter={() => setSopHover(true)}
            onMouseLeave={() => setSopHover(false)}
            style={{
              ...btnReset,
              ...(isSopActive ? { background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: '1px solid rgba(79,142,247,0.2)', fontWeight: 500 } : sopHover ? { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' } : {}),
            }}
          >
            <FileText style={{ width: '15px', height: '15px', flexShrink: 0, opacity: isSopActive ? 1 : sopHover ? 0.85 : 0.6, transition: 'opacity 0.15s' }} />
            <span style={{ flex: 1 }}>SOP & ISO</span>
            <ChevronDown size={12} style={{ transition: 'transform 0.2s ease', transform: sopOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.4, flexShrink: 0 }} />
          </button>
          <div style={{ overflow: 'hidden', maxHeight: sopOpen ? '100px' : '0px', transition: 'max-height 0.22s ease' }}>
            {sopSubItems.map(({ href, label }) => (
              <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} style={{ paddingLeft: '34px', fontSize: '12px' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {navItemsAdminBottom.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="nav-bottom">
        <button className="signout-btn" onClick={handleSignOut}>
          <LogOut className="nav-icon" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}