import Sidebar from '@/components/Sidebar'
 
export default function DashboardLayout({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {children}
      </main>
    </div>
  )
}
 