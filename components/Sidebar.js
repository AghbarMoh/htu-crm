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
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">HTU CRM</h1>
        <p className="text-xs text-gray-400 mt-1">Outreach Management</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full transition"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}