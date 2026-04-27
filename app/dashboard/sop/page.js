'use client'

import { Clock } from 'lucide-react'

export default function SopMainPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      gap: '16px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Clock size={28} color="#3b82f6" />
      </div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: '-0.5px',
        margin: 0
      }}>
        Soon
      </h1>
      <p style={{
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.35)',
        margin: 0
      }}>
        This module is under development
      </p>
    </div>
  )
}