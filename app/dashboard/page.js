'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to HTU CRM</h1>
        <p className="text-gray-500 mt-2">You are logged in successfully.</p>
        <button
          onClick={handleSignOut}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}