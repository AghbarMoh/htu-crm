'use client'

import Sidebar from '@/components/Sidebar'
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Dashboard error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: '#ffffff' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>⚠</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0' }}>Something went wrong</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px 0' }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', color: '#3b82f6', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function DashboardLayout({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}