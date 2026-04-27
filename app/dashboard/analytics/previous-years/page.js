'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, GraduationCap, Activity, AlertCircle, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, PieChart, Pie, ComposedChart, Line, CartesianGrid
} from 'recharts'

// ─── Design tokens (matching your existing dashboard) ───────────────────────
const C = {
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  amber:   '#f59e0b',
  green:   '#10b981',
  pink:    '#ec4899',
  cyan:    '#06b6d4',
  orange:  '#f97316',
  red:     '#ef4444',
}
const MAJOR_COLORS = [C.blue, C.purple, C.cyan, C.green, C.amber, C.orange, C.pink, '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa']
const TOOLTIP_STYLE = { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', color: '#fff' }

// ─── Reusable components ─────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '22px 24px', ...style
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px 0' }}>{children}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// Animated KPI number
function KPI({ value, label, sub, color, icon: Icon }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let start = 0
    const step = Math.ceil(value / 40)
    const t = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(t) }
      else setDisplay(start)
    }, 18)
    return () => clearInterval(t)
  }, [value])

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '30px', fontWeight: '800', color, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
          {display.toLocaleString()}
        </p>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', margin: '0 0 2px 0' }}>{label}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// Gender split bar
function GenderBar({ male, female }) {
  const total = male + female
  const malePct  = total ? Math.round(male  / total * 100) : 0
  const femPct   = total ? Math.round(female / total * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
<span style={{ fontSize: '12px', color: C.blue,  fontWeight: '700' }}>♂ {malePct || 0}% <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>({(male || 0).toLocaleString()})</span></span>
         <span style={{ fontSize: '12px', color: C.pink,  fontWeight: '700' }}>♀ {femPct || 0}% <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>({(female || 0).toLocaleString()})</span></span>      </div>
      <div style={{ height: '10px', borderRadius: '6px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ width: `${malePct}%`, background: `linear-gradient(90deg, ${C.blue}, #60a5fa)`, transition: 'width 1s ease', borderRadius: '6px 0 0 6px' }} />
        <div style={{ width: `${femPct}%`, background: `linear-gradient(90deg, #f472b6, ${C.pink})`, transition: 'width 1s ease', borderRadius: '0 6px 6px 0' }} />
      </div>
    </div>
  )
}

// Horizontal % bar row
function PctRow({ label, count, total, color, bold }) {
  const pct = total ? Math.round(count / total * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: bold ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: bold ? '600' : '400' }}>{label}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{(count || 0).toLocaleString()}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>{pct || 0}%</span>
        </div>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

// Custom treemap content
function TreemapNode({ x, y, width, height, name, count, male, female, depth, color }) {
  if (width < 30 || height < 20) return null
  const total = (male || 0) + (female || 0) + (count || 0)
  const malePct = total ? Math.round((male || 0) / total * 100) : 0
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={6} style={{ fill: color || '#1e293b', fillOpacity: 0.85, stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
      {width > 60 && height > 30 && (
        <>
          <text x={x + 10} y={y + 18} style={{ fontSize: Math.min(12, width / 8), fill: '#fff', fontWeight: '600', fontFamily: 'inherit' }}>
            {name?.length > Math.floor(width / 7) ? name.slice(0, Math.floor(width / 7)) + '…' : name}
          </text>
          {height > 44 && (
            <text x={x + 10} y={y + 32} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>
              {(male || count || 0).toLocaleString()} {male !== undefined ? '♂' : ''}
              {female != null ? `  ${(female || 0).toLocaleString()} ♀` : ''}
            </text>
          )}
          {height > 56 && malePct > 0 && (
            <text x={x + 10} y={y + 46} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>
              {malePct}% male
            </text>
          )}
        </>
      )}
    </g>
  )
}

// Custom tooltip for grade chart
function GradeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Grade {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: '12px', fontWeight: '600', color: p.fill }}>
          {p.name}: {p.value} students
        </p>
      ))}
    </div>
  )
}
function NationalitySpectrum({ data: natData, total }) {
  const [hovered, setHovered] = useState(null)
  const top     = natData.slice(0, 10)
  const max     = top[0]?.count || 1
  const colors  = [C.blue, C.purple, C.cyan, C.green, C.amber, C.orange, C.pink, '#a78bfa', '#34d399', '#60a5fa']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 4px' }}>
        {top.map((n, i) => {
          const pct    = n.count / max
          const color  = colors[i]
          const isHov  = hovered === n.name
          const barH   = Math.max(8, Math.round(pct * 110))
          return (
            <div
              key={n.name}
              onMouseEnter={() => setHovered(n.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: 'default' }}
            >
              {/* Count label on hover */}
              <div style={{ marginBottom: '4px', opacity: isHov ? 1 : 0, transition: 'opacity 0.2s' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color, whiteSpace: 'nowrap' }}>
                  {n.count.toLocaleString()}
                </span>
              </div>
              {/* Bar */}
              <div style={{
                width: '100%', height: `${barH}px`,
                background: isHov ? color : `${color}70`,
                borderRadius: '4px 4px 2px 2px',
                boxShadow: isHov ? `0 0 12px ${color}80, 0 0 24px ${color}30` : 'none',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Shimmer line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `${color}`, opacity: 0.8, borderRadius: '4px' }} />
              </div>
            </div>
          )
        })}
      </div>
      {/* X axis labels */}
      <div style={{ display: 'flex', gap: '6px', padding: '0 4px' }}>
        {top.map((n, i) => {
          const color = colors[i]
          const isHov = hovered === n.name
          const pct   = total ? Math.round(n.count / total * 100) : 0
          return (
            <div
              key={n.name}
              onMouseEnter={() => setHovered(n.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ flex: 1, textAlign: 'center', cursor: 'default' }}
            >
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: color, margin: '0 auto 4px auto',
                boxShadow: isHov ? `0 0 6px ${color}` : 'none',
                transition: 'box-shadow 0.2s',
              }} />
              <p style={{
                fontSize: '9px', margin: 0, fontWeight: isHov ? '700' : '400',
                color: isHov ? '#fff' : 'rgba(255,255,255,0.3)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }} title={n.name}>
                {n.name?.trim().slice(0, 6)}
              </p>
              <p style={{ fontSize: '9px', margin: '2px 0 0 0', fontWeight: '700', color: isHov ? color : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}>
                {pct}%
              </p>
            </div>
          )
        })}
      </div>
      {/* Hovered detail */}
      <div style={{
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        minHeight: '40px', transition: 'all 0.2s',
      }}>
        {hovered ? (() => {
          const n     = top.find(x => x.name === hovered)
          const color = colors[top.indexOf(n)]
          const pct   = total ? Math.round(n.count / total * 100) : 0
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{n.name?.trim()}</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{n.count.toLocaleString()} applicants</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color, letterSpacing: '-0.5px' }}>{pct}%</span>
              </div>
            </div>
          )
        })() : (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, textAlign: 'center' }}>Hover a bar to explore</p>
        )}
      </div>
    </div>
  )
}

function FatePipeline({ statusData, total }) {
  const [hovered, setHovered] = useState(null)
  const getColor = (name) => {
    const n = name?.toLowerCase() || ''
    if (n.includes('accept'))  return C.green
    if (n.includes('reject'))  return C.red
    if (n.includes('fail'))    return C.orange
    if (n.includes('abstain')) return C.amber
    return C.purple
  }
  const getIcon = (name) => {
    const n = name?.toLowerCase() || ''
    if (n.includes('accept'))  return '✓'
    if (n.includes('reject'))  return '✗'
    if (n.includes('fail'))    return '✕'
    if (n.includes('abstain')) return '⏸'
    return '·'
  }
  const sorted = [...(statusData || [])].sort((a, b) => b.count - a.count)
  let remaining = total
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {sorted.map((s, i) => {
        const color   = getColor(s.name)
        const icon    = getIcon(s.name)
        const pct     = total ? Math.round(s.count / total * 100) : 0
        const pipePct = remaining ? Math.round(s.count / remaining * 100) : 0
        const isHov   = hovered === s.name
        const prevRem = remaining
        remaining    -= s.count
        if (remaining < 0) remaining = 0
        return (
          <div key={s.name}
            onMouseEnter={() => setHovered(s.name)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', gap: '0px', alignItems: 'stretch', cursor: 'default' }}
          >
            {/* Left pipe column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
              {/* Pipe in from above */}
              <div style={{
                width: '4px', height: '14px', flexShrink: 0,
                background: i === 0 ? 'rgba(255,255,255,0.15)' : sorted[i-1] ? getColor(sorted[i-1].name) + '60' : 'rgba(255,255,255,0.1)',
              }} />
              {/* Node dot */}
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                background: isHov ? color : `${color}40`,
                border: `2px solid ${color}`,
                boxShadow: isHov ? `0 0 10px ${color}` : 'none',
                transition: 'all 0.2s', zIndex: 1,
              }} />
              {/* Pipe out below */}
              {i < sorted.length - 1 && (
                <div style={{
                  width: '4px', flex: 1, minHeight: '24px',
                  background: `${color}60`,
                }} />
              )}
            </div>

            {/* Right content */}
            <div style={{
              flex: 1, marginLeft: '10px', marginBottom: i < sorted.length - 1 ? '0px' : '0',
              padding: '6px 12px',
              background: isHov ? `${color}08` : 'transparent',
              borderRadius: '10px',
              border: `1px solid ${isHov ? color + '25' : 'transparent'}`,
              transition: 'all 0.2s',
              marginTop: '4px', marginBottom: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', color,
                    width: '16px', height: '16px', borderRadius: '4px',
                    background: `${color}15`, border: `1px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: isHov ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    {s.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                    {s.count.toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: '14px', fontWeight: '800', color,
                    letterSpacing: '-0.5px',
                    filter: isHov ? `drop-shadow(0 0 6px ${color})` : 'none',
                    transition: 'filter 0.2s',
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
              {/* Flow bar showing what % of remaining this drains */}
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}80)`,
                  borderRadius: '2px',
                  boxShadow: isHov ? `0 0 6px ${color}` : 'none',
                  transition: 'width 0.8s ease, box-shadow 0.2s',
                }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SchoolTypeBattery({ data: d }) {
  const total   = d.reduce((s, x) => s + x.count, 0)
  const private_ = d.find(x => x.name?.toLowerCase().includes('private'))
  const govt_    = d.find(x => x.name?.toLowerCase().includes('govern') || x.name?.toLowerCase().includes('public'))
  const other_   = d.find(x => x !== private_ && x !== govt_)
  const segments = [
    private_ && { label: 'Private',      count: private_.count, color: C.purple },
    govt_    && { label: 'Governmental',  count: govt_.count,    color: C.cyan   },
    other_   && { label: other_.name,     count: other_.count,   color: 'rgba(255,255,255,0.3)' },
  ].filter(Boolean)
  let cumulative = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Battery body */}
      <div style={{ position: 'relative', margin: '0 auto' }}>
        {/* Battery tip */}
        <div style={{ width: '24px', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px 3px 0 0', margin: '0 auto' }} />
        {/* Battery shell */}
        <div style={{ width: '140px', height: '200px', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '8px', overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.03)' }}>
          {/* Fill segments from bottom */}
          {[...segments].reverse().map((seg, ri) => {
            const i   = segments.length - 1 - ri
            const pct = total ? (seg.count / total) * 100 : 0
            const bot = cumulative
            cumulative += pct
            return (
              <div key={seg.label} style={{
                position: 'absolute', bottom: `${bot}%`, left: 0, right: 0,
                height: `${pct}%`,
                background: `linear-gradient(180deg, ${seg.color}99, ${seg.color}dd)`,
                borderTop: ri < segments.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                transition: 'height 1s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
                {pct > 12 && (
                  <>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', lineHeight: 1, filter: `drop-shadow(0 0 8px ${seg.color})` }}>
                      {Math.round(pct)}%
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', fontWeight: '600' }}>
                      {seg.label}
                    </span>
                  </>
                )}
              </div>
            )
          })}
          {/* Horizontal charge lines */}
          {[25, 50, 75].map(p => (
            <div key={p} style={{ position: 'absolute', bottom: `${p}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)', zIndex: 2 }} />
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.map(seg => {
          const pct = total ? Math.round(seg.count / total * 100) : 0
          return (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{seg.label}</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: seg.color }}>{pct}%</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{seg.count.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeederSchoolHeatList({ schools }) {
  const [hovered, setHovered] = useState(null)
  const max     = schools[0]?.count || 1
  const getMedalColor = (i) => i === 0 ? C.amber : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3a' : null
  const SEGMENTS = 8

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
      {schools.map((s, i) => {
        const pct      = s.count / max
        const filled   = Math.max(1, Math.round(pct * SEGMENTS))
        const mColor   = getMedalColor(i)
        const barColor = mColor || C.blue
        const isHov    = hovered === s.name
        return (
          <div
            key={s.name}
            onMouseEnter={() => setHovered(s.name)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '7px 10px', borderRadius: '10px',
              background: isHov ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${isHov ? barColor + '30' : 'transparent'}`,
              transition: 'all 0.15s', cursor: 'default',
            }}
          >
            {/* Rank badge */}
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
              background: mColor ? `${mColor}20` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${mColor ? mColor + '35' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: i < 3 ? '13px' : '10px', fontWeight: '800', color: mColor || 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
            </div>

            {/* School name */}
            <span style={{
              fontSize: '12px', flex: 1, minWidth: 0,
              fontWeight: i < 3 ? '600' : '400',
              color: i < 3 ? '#fff' : 'rgba(255,255,255,0.55)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={s.name}>
              {s.name?.length > 26 ? s.name.slice(0, 26) + '…' : s.name}
            </span>

            {/* Signal segments */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', flexShrink: 0, height: '18px' }}>
              {Array.from({ length: SEGMENTS }).map((_, si) => {
                const active = si < filled
                const segH   = 6 + (si / (SEGMENTS - 1)) * 12
                return (
                  <div key={si} style={{
                    width: '5px',
                    height: `${segH}px`,
                    borderRadius: '2px',
                    background: active ? barColor : 'rgba(255,255,255,0.08)',
                    boxShadow: active && isHov ? `0 0 6px ${barColor}` : 'none',
                    opacity: active ? (0.5 + (si / SEGMENTS) * 0.5) : 1,
                    transition: 'all 0.2s',
                  }} />
                )
              })}
            </div>

            {/* Count */}
            <span style={{
              fontSize: '11px', fontWeight: '700', flexShrink: 0, minWidth: '36px', textAlign: 'right',
              color: isHov ? barColor : mColor || 'rgba(255,255,255,0.3)',
              transition: 'color 0.2s',
            }}>
              {s.count.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RegionPulseChart({ govData, total }) {
  const [hoveredRing, setHoveredRing] = useState(null)
  const rings      = govData.slice(0, 8)
  const maxCount   = rings[0]?.count || 1
  const ringColors = [C.blue, C.purple, C.cyan, C.green, C.amber, C.orange, C.pink, 'rgba(255,255,255,0.4)']
  const cx = 120, cy = 120
  const minR = 18, maxR = 108
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ flexShrink: 0, position: 'relative', width: '240px', height: '240px' }}>
        <svg width="240" height="240">
          {rings.map((g, i) => {
            const pct    = g.count / maxCount
            const radius = minR + pct * (maxR - minR)
            const color  = ringColors[i]
            const isHov  = hoveredRing === g.name
            const circ   = 2 * Math.PI * radius
            const filled = pct * circ
            return (
              <g key={g.name}
                onMouseEnter={() => setHoveredRing(g.name)}
                onMouseLeave={() => setHoveredRing(null)}
                style={{ cursor: 'default' }}
              >
                <circle cx={cx} cy={cy} r={radius}
                  fill="none" stroke={color} strokeWidth={isHov ? 3.5 : 2}
                  opacity={hoveredRing && !isHov ? 0.12 : isHov ? 1 : 0.25}
                  style={{ transition: 'all 0.2s' }} />
                <circle cx={cx} cy={cy} r={radius}
                  fill="none" stroke={color} strokeWidth={isHov ? 5 : 3}
                  strokeDasharray={`${filled} ${circ - filled}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  opacity={hoveredRing && !isHov ? 0.15 : 1}
                  style={{
                    filter: isHov ? `drop-shadow(0 0 6px ${color})` : 'none',
                    transition: 'all 0.2s'
                  }} />
                {isHov && (
                  <circle
                    cx={cx + radius * Math.cos((filled / circ * 360 - 90) * Math.PI / 180)}
                    cy={cy + radius * Math.sin((filled / circ * 360 - 90) * Math.PI / 180)}
                    r={4} fill={color}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                  />
                )}
              </g>
            )
          })}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.3)" fontFamily="inherit">
            {hoveredRing ? rings.find(r => r.name === hoveredRing)?.count.toLocaleString() : rings[0]?.count.toLocaleString()}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.2)" fontFamily="inherit" letterSpacing="0.5">
            {hoveredRing ? hoveredRing.slice(0, 12) : (rings[0]?.name || '').slice(0, 12)}
          </text>
        </svg>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {rings.map((g, i) => {
          const color = ringColors[i]
          const pct   = total ? Math.round(g.count / total * 100) : 0
          const isHov = hoveredRing === g.name
          return (
            <div key={g.name}
              onMouseEnter={() => setHoveredRing(g.name)}
              onMouseLeave={() => setHoveredRing(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default',
                opacity: hoveredRing && !isHov ? 0.3 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: isHov ? `0 0 6px ${color}` : 'none', transition: 'box-shadow 0.2s' }} />
              <span style={{ fontSize: '11px', color: i < 3 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', flex: 1, fontWeight: i < 3 ? '600' : '400' }}>
                {g.name.length > 16 ? g.name.slice(0, 16) + '…' : g.name}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color }}>{pct}%</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', minWidth: '36px', textAlign: 'right' }}>{g.count.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MajorDNAChart({ dna }) {
  const [hoveredMajor, setHoveredMajor] = useState(null)
  const traits = [
    { key: 'genderRatio',  label: '♂ %',     color: C.blue,   desc: 'Male ratio',        max: 100 },
    { key: 'avgTawjihi',   label: 'Tawjihi',  color: C.amber,  desc: 'Avg Tawjihi score', max: 100, min: 60 },
    { key: 'privateRatio', label: 'Private',  color: C.purple, desc: 'Private school %',  max: 100 },
    { key: 'topGovPct',    label: 'Top Gov',  color: C.cyan,   desc: 'Top governorate %', max: 100 },
  ]
  return (
    <div>
      {/* Trait legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {traits.map(t => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: t.color }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{t.desc}</span>
          </div>
        ))}
      </div>
      {/* DNA grid */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '6px', minWidth: `${dna.length * 52}px`, alignItems: 'flex-end' }}>
          {dna.map((major, mi) => {
            const isHovered = hoveredMajor === major.major
            return (
              <div
                key={major.major}
                onMouseEnter={() => setHoveredMajor(major.major)}
                onMouseLeave={() => setHoveredMajor(null)}
                style={{
                  flex: 1, minWidth: '44px', cursor: 'default',
                  opacity: hoveredMajor && !isHovered ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Strand bars */}
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '160px', marginBottom: '8px', justifyContent: 'center' }}>
                  {traits.map((t) => {
                    const rawVal = major[t.key]
                    const minVal = t.min || 0
                    const pct    = Math.min(100, Math.max(0, ((rawVal - minVal) / (t.max - minVal)) * 100))
                    const barH   = Math.max(4, Math.round(pct * 1.5))
                    return (
                      <div key={t.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div style={{
                          width: '6px', height: `${barH}px`,
                          background: isHovered ? t.color : `${t.color}88`,
                          borderRadius: '3px 3px 2px 2px',
                          transition: 'height 0.6s ease, background 0.2s',
                          boxShadow: isHovered ? `0 0 8px ${t.color}80` : 'none',
                        }} />
                      </div>
                    )
                  })}
                </div>
                {/* Major label */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '9px', fontWeight: isHovered ? '700' : '500',
                    color: isHovered ? '#fff' : 'rgba(255,255,255,0.35)',
                    margin: 0, lineHeight: '1.3',
                    writingMode: 'vertical-rl', textOrientation: 'mixed',
                    transform: 'rotate(180deg)', height: '60px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    transition: 'color 0.2s'
                  }}>
                    {major.major.length > 18 ? major.major.slice(0, 18) + '…' : major.major}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Hover detail panel */}
      {(() => {
        const m = dna.find(d => d.major === hoveredMajor)
        return (
          <div style={{
            marginTop: '12px', padding: '12px 16px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', display: 'flex', gap: '20px', flexWrap: 'wrap',
            minHeight: '64px',
            opacity: m ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}>
            {m && (
              <>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0' }}>{m.major}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{m.total.toLocaleString()} enrolled students</p>
                </div>
                {traits.map(t => (
                  <div key={t.key} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: t.color, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>
                      {t.key === 'avgTawjihi' ? m[t.key] : `${m[t.key]}%`}
                    </p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.desc}</p>
                    {t.key === 'topGovPct' && <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 0' }}>{m.topGov}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
function PreviousYearsAnalyticsPage() {  const searchParams  = useSearchParams()
  const router        = useRouter()
  const initialYear   = searchParams.get('year') || ''

  const [cohorts,  setCohorts]  = useState([])
  const [selYear,  setSelYear]  = useState(initialYear)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [showDrop, setShowDrop] = useState(false)

  useEffect(() => { fetchCohorts() }, [])
  useEffect(() => { if (selYear) fetchAnalytics(selYear) }, [selYear])

  const fetchCohorts = async () => {
    const res  = await fetch('/api/previous-years')
    const list = await res.json()
    setCohorts(Array.isArray(list) ? list : [])
    if (!selYear && list.length > 0) setSelYear(String(list[0].year))
  }

  const fetchAnalytics = async (year) => {
    setLoading(true); setData(null)
    try {
      const res = await fetch(`/api/previous-years/${year}/analytics`)
      const d   = await res.json()
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const selectedCohort = cohorts.find(c => String(c.year) === String(selYear))

  // ── Prepare chart data ──────────────────────────────────────────────────
  const treemapData = data?.degreeTree?.map((deg, di) => ({
    name: deg.name,
    color: [C.blue, C.purple, C.amber, C.green][di % 4],
    children: deg.children.map((maj, mi) => ({
      name: maj.name,
      size: maj.count,
      count: maj.count,
      male:  maj.male,
      female: maj.female,
      color: MAJOR_COLORS[mi % MAJOR_COLORS.length],
    }))
  })) || []

const flatTreemap = Object.values(
  treemapData.flatMap(d => d.children).reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { ...item }
    } else {
      acc[item.name].size   += item.size
      acc[item.name].count  += item.count
      acc[item.name].male   += item.male
      acc[item.name].female += item.female
    }
    return acc
  }, {})
)
  const radarData = data?.majorGenderData?.slice(0, 8).map(m => ({
    major: m.major?.length > 14 ? m.major.slice(0, 14) + '…' : m.major,
    Male:   m.Male,
    Female: m.Female,
  })) || []

  const govData = data?.governorateData?.slice(0, 10) || []

  const donutDegree = data?.degreeCounts?.map((d, i) => ({
    ...d, fill: [C.blue, C.amber, C.green, 'rgba(255,255,255,0.2)'][i % 4]
  })) || []

  const donutStream = data?.streamCounts?.map((d, i) => ({
    ...d, fill: [C.purple, C.cyan, C.orange, C.green, C.amber, C.pink][i % 6]
  })) || []

  const donutSchool = data?.schoolTypeCounts?.map((d, i) => ({
    ...d, fill: [C.purple, C.cyan, 'rgba(255,255,255,0.25)'][i % 3]
  })) || []

  // ── Donut chart helper ──
  const DonutChart = ({ data: d, title, sub, size = 180 }) => {
    const [active, setActive] = useState(null)
    const total = d.reduce((s, x) => s + x.count, 0)
    const cx = size / 2, cy = size / 2
    const ir = size * 0.29, or = size * 0.44
    return (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          <PieChart width={size} height={size}>
            <Pie data={d} cx={cx} cy={cy} innerRadius={ir} outerRadius={or}
              dataKey="count" paddingAngle={2} strokeWidth={0}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
              {d.map((entry, i) => (
                <Cell key={i} fill={entry.fill} opacity={active === null || active === i ? 1 : 0.35}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v.toLocaleString()} · ${Math.round(v / total * 100)}%`]} />
          </PieChart>
        </div>
        <div style={{ flex: 1 }}>
          {d.map((item, i) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
              opacity: active === null || active === i ? 1 : 0.35, transition: 'opacity 0.2s', cursor: 'default' }}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.fill, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1, textTransform: 'capitalize' }}>{item.name}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: item.fill }}>{Math.round(item.count / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pill badge for has/not ──
  const BoolStat = ({ trueVal, falseVal, trueLabel, falseLabel, trueColor, falseColor }) => {
    const total = trueVal + falseVal
    const truePct  = total ? Math.round(trueVal  / total * 100) : 0
    const falsePct = total ? Math.round(falseVal / total * 100) : 0
    return (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: `${trueColor}12`, border: `1px solid ${trueColor}25`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: trueColor, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{truePct}%</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{trueLabel}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 0' }}>{(trueVal || 0).toLocaleString()} students</p>
          </div>
          <div style={{ flex: 1, background: `${falseColor}12`, border: `1px solid ${falseColor}25`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: falseColor, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{falsePct}%</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{falseLabel}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 0' }}>{(falseVal || 0).toLocaleString()} students</p>
          </div>
        </div>
        <div style={{ height: '6px', borderRadius: '4px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ width: `${truePct}%`, background: trueColor, transition: 'width 1s ease' }} />
          <div style={{ width: `${falsePct}%`, background: falseColor, transition: 'width 1s ease' }} />
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => router.push('/dashboard/analytics')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 3px 0', letterSpacing: '-0.5px' }}>
              Previous Years Analytics
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {selectedCohort ? `${selectedCohort.label} · ${selectedCohort.total_imported?.toLocaleString()} students` : 'Select a cohort to explore'}
            </p>
          </div>
        </div>

        {/* Year selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowDrop(d => !d)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '600',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <GraduationCap size={15} color="rgba(255,255,255,0.4)" />
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedCohort?.label || 'Select year'}</span>
            <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ transform: showDrop ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showDrop && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '180px', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', zIndex: 100 }}>
              {cohorts.map(c => (
                <button key={c.id} onClick={() => { setSelYear(String(c.year)); setShowDrop(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', fontWeight: String(c.year) === String(selYear) ? '700' : '400', color: String(c.year) === String(selYear) ? C.blue : 'rgba(255,255,255,0.6)', background: String(c.year) === String(selYear) ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c.label}
                  <span style={{ float: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{c.total_imported?.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Crunching the numbers…</p>
        </div>
      )}

      {/* ── Empty / No cohort ── */}
      {!loading && !data && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <AlertCircle size={32} color="rgba(255,255,255,0.15)" />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Select a cohort year to see analytics</p>
        </div>
      )}

      {!loading && data && !data.empty && (
        <>
          {/* ══ ROW 1 — KPI Cards ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <KPI value={data.total}         label="Total Applicants"   sub="imported this cohort"     color={C.blue}   icon={Users} />
            <KPI value={data.male}           label="Male Applicants"    sub={`${Math.round(data.male / data.total * 100)}% of cohort`}   color={C.blue}   icon={Users} />
            <KPI value={data.female}         label="Female Applicants"  sub={`${Math.round(data.female / data.total * 100)}% of cohort`} color={C.pink}   icon={Users} />
            <KPI value={data.hasStudentNo}   label="Enrolled (Has ID)"  sub={`${Math.round(data.hasStudentNo / data.total * 100)}% converted`} color={C.green}  icon={Activity} />
          </div>

          {/* ══ ROW 2 — Gender bar + Degree donut + Stream donut ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* Gender split */}
            <Card>
              <CardTitle sub="male vs female distribution">Gender Split</CardTitle>
              <GenderBar male={data.male} female={data.female} />
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  { label: 'Male',   val: data.male,   color: C.blue },
                  { label: 'Female', val: data.female, color: C.pink },
                ].map(g => (
                  <PctRow key={g.label} label={g.label} count={g.val} total={data.total} color={g.color} />
                ))}
              </div>
            </Card>

            {/* Degree donut */}
            <Card>
              <CardTitle sub="by program level">Degree Breakdown</CardTitle>
              <DonutChart data={donutDegree} size={170} />
            </Card>

            {/* Academic Stream donut */}
            <Card>
              <CardTitle sub="high school stream">Academic Stream</CardTitle>
              <DonutChart data={donutStream} size={170} />
            </Card>
          </div>

          {/* ══ ROW 3 — Major × Gender TREEMAP (full width) ══ */}
          <Card style={{ marginBottom: '14px' }}>
            <CardTitle sub="size = number of applicants · color per major · hover for male / female breakdown">
              Major × Gender Map
            </CardTitle>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {data.degreeCounts?.map((d, i) => {
                const color = [C.blue, C.amber, C.green, 'rgba(255,255,255,0.3)'][i % 4]
                return (
                  <span key={d.name} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: `${color}15`, border: `1px solid ${color}25`, color }}>
                    {d.name} · {(d.count || 0).toLocaleString()}
                  </span>
                )
              })}
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <Treemap
                data={flatTreemap}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<TreemapNode />}
              >
                <Tooltip contentStyle={TOOLTIP_STYLE} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  const tot = (d.male || 0) + (d.female || 0)
                  return (
                    <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#fff' }}>{d.name}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: C.blue }}>♂ Male: {(d.male || 0).toLocaleString()}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: C.pink }}>♀ Female: {(d.female || 0).toLocaleString()}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Total: {tot.toLocaleString()}</p>
                    </div>
                  )
                }} />
              </Treemap>
            </ResponsiveContainer>
          </Card>

          {/* ══ ROW 4 — Major × Gender stacked bar + Tawjihi grade distribution ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', marginBottom: '14px' }}>

          {/* ── Enrollment Funnel by Major ── */}
            <Card>
              <CardTitle sub="total applicants → accepted → enrolled (has student ID) · sorted by volume">
                Enrollment Funnel by Major
              </CardTitle>
              <div style={{ overflowY: 'auto', maxHeight: '340px', paddingRight: '4px' }}>
                {(data.enrollmentFunnel || []).map((m, i) => {
                  const enrollColor = m.enrollRate >= 60 ? C.green : m.enrollRate >= 35 ? C.amber : C.red
                  return (
                    <div key={m.major} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.major}>
                          {m.major.length > 28 ? m.major.slice(0, 28) + '…' : m.major}
                        </span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{m.total.toLocaleString()} applicants</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: enrollColor, background: `${enrollColor}15`, border: `1px solid ${enrollColor}25`, borderRadius: '20px', padding: '1px 8px' }}>
                            {m.enrollRate}% enrolled
                          </span>
                        </div>
                      </div>
                      {/* Three-layer bar */}
                      <div style={{ position: 'relative', height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                        {/* Total (background) */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
                        {/* Accepted */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${m.acceptRate}%`,
                          background: `linear-gradient(90deg, ${C.blue}cc, ${C.cyan}99)`,
                          borderRadius: '6px', transition: 'width 1s ease'
                        }} />
                        {/* Enrolled */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${m.enrollRate}%`,
                          background: `linear-gradient(90deg, ${enrollColor}, ${enrollColor}cc)`,
                          borderRadius: '6px', transition: 'width 1.2s ease',
                          boxShadow: `0 0 8px ${enrollColor}60`
                        }} />
                        {/* Labels inside bar */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '8px', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2px' }}>
                            {m.accepted} accepted
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>·</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: enrollColor }}>
                            {m.enrolled} enrolled
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { color: 'rgba(255,255,255,0.15)', label: 'Total Applicants' },
                  { color: C.blue,  label: 'Accepted' },
                  { color: C.green, label: 'Enrolled (≥60%)' },
                  { color: C.amber, label: 'Enrolled (35–60%)' },
                  { color: C.red,   label: 'Enrolled (<35%)' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tawjihi grade distribution */}
            <Card>
              <CardTitle sub="score distribution by gender">Tawjihi Grade Distribution</CardTitle>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data.gradeDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GradeTooltip />} />
                  <Bar dataKey="Male"   fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="Female" fill={C.pink} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  <Line type="monotone" dataKey="total" stroke={C.amber} strokeWidth={2} dot={{ fill: C.amber, r: 3 }} strokeDasharray="4 2" />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: 'rgba(255,255,255,0.4)' }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Avg tawjihi callout */}
              {(() => {
const vals = (data?.gradeDistribution || []).reduce((s, d) => ({ sum: s.sum + d.total * (parseInt(d.range) + 2.5), cnt: s.cnt + d.total }), { sum: 0, cnt: 0 });                return (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Cohort Tawjihi Average</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: C.amber, letterSpacing: '-0.5px' }}>
                      ~{(vals.sum / vals.cnt).toFixed(1)}
                    </span>
                  </div>
                )
              })()}
            </Card>
          </div>

          {/* ══ ROW 5 — Top Avg Tawjihi by Major + Governorate ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* Grade Leaders by Major — Podium Score Cards */}
            <Card>
              <CardTitle sub="average tawjihi score per major · arc = position in 70–100 range">Grade Leaders by Major</CardTitle>
              <div style={{ overflowY: 'auto', maxHeight: '300px', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.majorAvgData || []).map((entry, i) => {
                  const score     = entry.avg
                  const color     = score >= 90 ? C.green : score >= 85 ? C.blue : score >= 80 ? C.amber : C.orange
                  const medal     = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                  const arcPct    = Math.min(100, Math.max(0, ((score - 70) / 30) * 100))
                  const r         = 18
                  const circ      = 2 * Math.PI * r
                  const dash      = (arcPct / 100) * circ * 0.75
                  const gap       = circ - dash
                  const rotation  = -225
                  return (
                    <div key={entry.major} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', borderRadius: '12px',
                      background: i < 3 ? `${color}08` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${i < 3 ? `${color}20` : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}35` }}
                      onMouseLeave={e => { e.currentTarget.style.background = i < 3 ? `${color}08` : 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = i < 3 ? `${color}20` : 'rgba(255,255,255,0.05)' }}
                    >
                      {/* Arc gauge */}
                      <div style={{ position: 'relative', flexShrink: 0, width: '44px', height: '44px' }}>
                        <svg width="44" height="44" style={{ transform: `rotate(${rotation}deg)` }}>
                          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"
                            strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" />
                          <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
                            strokeDasharray={`${dash} ${gap + circ * 0.25}`} strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dasharray 0.8s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: medal ? '14px' : '9px', lineHeight: 1 }}>
                            {medal || <span style={{ fontWeight: '700', color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>#{i + 1}</span>}
                          </span>
                        </div>
                      </div>
                      {/* Major name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: i < 3 ? '700' : '500', color: i < 3 ? '#fff' : 'rgba(255,255,255,0.6)', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.major}>
                          {entry.major.length > 26 ? entry.major.slice(0, 26) + '…' : entry.major}
                        </p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                          {entry.count} students sampled
                        </p>
                      </div>
                      {/* Score */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '22px', fontWeight: '800', color, margin: 0, letterSpacing: '-0.5px', lineHeight: 1, filter: i < 3 ? `drop-shadow(0 0 8px ${color}60)` : 'none' }}>
                          {score}
                        </p>
                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>avg score</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Applicants by Region — Concentric Ring Pulse */}
            <Card>
              <CardTitle sub="each ring = one region · size proportional to applicant share">Applicants by Region</CardTitle>
              <RegionPulseChart govData={govData} total={data.total} />
            </Card>
          </div>

          {/* ══ ROW 6 — School Type + Top Schools + Student No + Disability ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.4fr 0.6fr', gap: '12px', marginBottom: '14px' }}>

            {/* School Type */}
            <Card>
              <CardTitle sub="private vs governmental · fill = share">School Type</CardTitle>
              <SchoolTypeBattery data={donutSchool} />
            </Card>

            {/* Top Schools */}
            <Card>
              <CardTitle sub="top schools by applicant count · background heat = relative volume">Top Feeder Schools</CardTitle>
              <FeederSchoolHeatList schools={data.topSchools?.slice(0, 12) || []} />
            </Card>

            {/* Student No + Disability stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Card style={{ flex: 1 }}>
                <CardTitle sub="HTU student number assigned">Enrollment Status</CardTitle>
                <BoolStat
                  trueVal={data.hasStudentNo} falseVal={data.noStudentNo}
                  trueLabel="Has Student No" falseLabel="No Number Yet"
                  trueColor={C.green} falseColor="rgba(255,255,255,0.2)"
                />
              </Card>
              <Card style={{ flex: 1 }}>
                <CardTitle sub="applicants with disabilities">Disability Status</CardTitle>
                <BoolStat
                  trueVal={data.hasDisability} falseVal={data.noDisability}
                  trueLabel="Has Disability" falseLabel="No Disability"
                  trueColor={C.amber} falseColor="rgba(255,255,255,0.2)"
                />
              </Card>
            </div>
          </div>

          {/* ══ ROW 7 — Major DNA + Nationality ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* ── Major DNA Fingerprint ── */}
            <Card>
              <CardTitle sub="enrolled students only (has student ID) · each column = one trait · hover a major to highlight">
                Major DNA Fingerprint — Enrolled
              </CardTitle>
              <MajorDNAChart dna={data.majorDNA || []} />
            </Card>

            {/* Nationality */}
            <Card>
              <CardTitle sub="top 10 nationalities · hover to explore">Nationality Breakdown</CardTitle>
              <NationalitySpectrum data={data.nationalityData || []} total={data.total} />
            </Card>
          </div>

          {/* ══ ROW 8 — Application Status Pipeline (full width) ══ */}
          <Card style={{ marginBottom: '14px' }}>
            <CardTitle sub="applicant fate at each decision stage · hover to inspect">Application Status Pipeline</CardTitle>
            <FatePipeline statusData={data.statusData} total={data.total} />
          </Card>
        </>
      )}

      {/* Empty cohort */}
      {!loading && data?.empty && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <AlertCircle size={32} color="rgba(255,255,255,0.15)" />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>No data imported for this cohort yet.</p>
          <button onClick={() => router.push('/dashboard/applicants/previous-years')}
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: C.blue, cursor: 'pointer' }}>
            Go Import Data
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px }
      `}</style>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.3)', padding: '40px', textAlign: 'center' }}>Loading...</div>}>
      <PreviousYearsAnalyticsPage />
    </Suspense>
  )
}