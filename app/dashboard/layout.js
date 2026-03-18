import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', background: '#0f0f13', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        minHeight: '100vh',
        background: '#13131a',
        padding: '32px',
      }}>
        {children}
      </main>
    </div>
  )
}