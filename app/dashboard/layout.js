import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-gray-100 p-8">
        {children}
      </main>
    </div>
  )
}