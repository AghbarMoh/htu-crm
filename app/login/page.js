'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lit, setLit] = useState(false)
  const [pullDist, setPullDist] = useState(0)

  const isDragging = useRef(false)
  const startY = useRef(0)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  const lightUp = () => {
    if (lit) return
    setLit(true)
    setPullDist(0)
  }

  const onStart = (e) => {
    if (lit) return
    isDragging.current = true
    startY.current = e.touches ? e.touches[0].clientY : e.clientY
    e.preventDefault()
  }

  const onMove = (e) => {
    if (!isDragging.current || lit) return
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const dist = Math.max(0, Math.min(90, clientY - startY.current))
    setPullDist(dist)
    if (dist > 60) lightUp()
    e.preventDefault()
  }

  const onEnd = () => {
    if (!lit) setPullDist(0)
    isDragging.current = false
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [lit])

  const ropeHeight = lit ? 48 : 48 + pullDist * 0.6
  const wireHeight = lit ? 60 : 60 - pullDist * 0.2
  const ropeOffset = lit ? 0 : pullDist * 0.4

  return (
    <div
      style={{
        minHeight: '100vh',
        background: lit
          ? 'linear-gradient(135deg, #0f0f13 0%, #1a1a2e 50%, #16213e 100%)'
          : '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        transition: 'background 1.2s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient glow when lit */}
      {lit && (
        <>
          <div style={{
            position: 'absolute',
            width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            top: '-200px', right: '-200px',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            bottom: '-100px', left: '-100px',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Bulb assembly */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Wire from ceiling */}
        <div style={{
          width: '2px',
          height: wireHeight + 'px',
          background: '#555',
          transition: lit ? 'height 0.3s ease' : 'none',
        }} />

        {/* Bulb SVG */}
        <svg
          width="44" height="56"
          viewBox="0 0 44 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: lit
              ? 'drop-shadow(0 0 22px rgba(255,230,80,0.8)) drop-shadow(0 0 8px rgba(255,220,50,0.5))'
              : 'none',
            transition: 'filter 0.6s ease',
          }}
        >
          <path
            d="M14 36C10 31 8 26 8 21C8 13.3 14.3 7 22 7C29.7 7 36 13.3 36 21C36 26 34 31 30 36L28 42H16L14 36Z"
            fill={lit ? '#FFE040' : '#333'}
          />
          <rect x="16" y="42" width="12" height="4" rx="2" fill={lit ? '#CCA020' : '#444'} />
          <rect x="17" y="46" width="10" height="4" rx="2" fill={lit ? '#CCA020' : '#444'} />
          <line x1="22" y1="0" x2="22" y2="7" stroke="#555" strokeWidth="2" />
          <line x1="18" y1="30" x2="18" y2="38" stroke={lit ? '#FFF8DC' : '#555'} strokeWidth="1.5" />
          <line x1="22" y1="28" x2="22" y2="38" stroke={lit ? '#FFF8DC' : '#555'} strokeWidth="1.5" />
          <line x1="26" y1="30" x2="26" y2="38" stroke={lit ? '#FFF8DC' : '#555'} strokeWidth="1.5" />
        </svg>

        {/* Rope + ring (draggable) */}
        <div
          onMouseDown={onStart}
          onTouchStart={onStart}
          onClick={() => { if (!lit) lightUp() }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: lit ? 'default' : 'grab',
            transform: `translateY(${ropeOffset}px)`,
            transition: lit ? 'transform 0.3s ease' : 'none',
            touchAction: 'none',
          }}
        >
          <div style={{
            width: '3px',
            height: ropeHeight + 'px',
            background: 'repeating-linear-gradient(180deg, #8B7355 0px, #8B7355 4px, #6B5535 4px, #6B5535 8px)',
            borderRadius: '2px',
            transition: lit ? 'height 0.3s ease' : 'none',
          }} />
          <div style={{
            width: '14px', height: '14px',
            border: '2.5px solid #8B7355',
            borderRadius: '50%',
            marginTop: '2px',
          }} />
        </div>

        {/* Pull hint */}
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '12px',
          letterSpacing: '0.5px',
          opacity: lit ? 0 : 1,
          transition: 'opacity 0.5s ease',
          fontFamily: 'sans-serif',
        }}>
          pull to turn on
        </p>
      </div>

      {/* Login card — fades in after light */}
      <div style={{
        opacity: lit ? 1 : 0,
        transform: lit ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s',
        pointerEvents: lit ? 'all' : 'none',
        width: '100%',
        maxWidth: '420px',
        padding: '0 20px 40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '40px 40px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
  <Image
    src="/logo.png"
    alt="HTU Logo"
    width={100}
    height={100}
    priority
  style={{ objectFit: 'contain', display: 'block', margin: '0 auto 12px' }}
  />
  <h1 style={{
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px',
    fontFamily: 'sans-serif',
  }}>HTU CRM</h1>
  <p style={{
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
    fontFamily: 'sans-serif',
  }}>Sign in to your account</p>
</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: '500',
                color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontFamily: 'sans-serif',
              }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@htu.edu.jo"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'sans-serif',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: '500',
                color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontFamily: 'sans-serif',
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'sans-serif',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#f87171',
                fontFamily: 'sans-serif',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
                transition: 'all 0.2s',
                fontFamily: 'sans-serif',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '28px',
            marginBottom: 0,
            fontFamily: 'sans-serif',
          }}>
            HTU Student Recruitment & Outreach Office
          </p>
        </div>
      </div>
    </div>
  )
}