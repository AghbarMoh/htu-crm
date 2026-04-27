'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell, LabelList } from 'recharts'
import { Download, Filter, BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  const [applicants, setApplicants] = useState([])
  const [visits, setVisits] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
  const [contacts, setContacts] = useState([])
  const [completedApplicants, setCompletedApplicants] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeGrouping, setActiveGrouping] = useState([])
  const [filters, setFilters] = useState({
    type: [],
    private_or_public: [],
    connection_status: []
  })
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      if (data) {
        setApplicants(data.applicants || [])
        const completedVisitsRaw = (data.visits || []).filter(visit =>
          (data.completions || []).some(comp => comp.visit_id === visit.id)
        )
        const seenSchools = new Set()
        const completedVisits = completedVisitsRaw.filter(v => {
          const key = (v.school_name || '').trim().toLowerCase()
          if (seenSchools.has(key)) return false
          seenSchools.add(key)
          return true
        })
        setVisits(completedVisits)
        setVisitStudents(data.students || [])
        setContacts(data.contacts || [])
        setCompletedApplicants(data.completedApplicants || [])
      }
    } catch (error) {
      console.error("Analytics Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGrouping = (dim) => {
    setActiveGrouping(prev =>
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    )
  }

  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }))
  }

  // --- Core Numbers ---
  const totalApplicants = completedApplicants.length
  const totalVisits = visits.length
  const totalVisitStudents = visitStudents.length
  const totalContacts = contacts.length

  // --- Percentage helpers ---
  const pct = (num, denom) => denom === 0 ? '0%' : Math.round((num / denom) * 100) + '%'
  const pctNum = (num, denom) => denom === 0 ? 0 : Math.round((num / denom) * 100)

  // --- Major breakdown ---
  const majorCounts = {}
  completedApplicants.forEach(a => { if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1 })
  const totalMajorApplicants = completedApplicants.filter(a => a.major).length
  const majorData = Object.entries(majorCounts)
    .map(([name, count]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '...' : name,
      fullName: name,
      count,
      value: pctNum(count, totalMajorApplicants),
      pct: pctNum(count, totalMajorApplicants)
    }))
    .sort((a, b) => b.count - a.count)

  // --- Visit type breakdown ---
  const typeCounts = {}
  visits.forEach(v => { if (v.type) typeCounts[v.type] = (typeCounts[v.type] || 0) + 1 })
  const typeBreakdown = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count, pct: pctNum(count, totalVisits) }))
    .sort((a, b) => b.count - a.count)

  // --- School type breakdown ---
  const privateCount = visits.filter(v => v.private_or_public === 'private').length
  const publicCount = visits.filter(v => v.private_or_public === 'public').length

  // --- Top Performing Schools ---
  const schoolCounts = {}
  completedApplicants.forEach(a => {
    if (a.school_name) schoolCounts[a.school_name] = (schoolCounts[a.school_name] || 0) + 1
  })
  const totalCompletedApplicants = completedApplicants.length
  const topSchools = Object.entries(schoolCounts)
    .map(([name, count]) => ({ name, count, pct: pctNum(count, totalCompletedApplicants) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // --- Repeat vs New Visits ---
  const newVisits = visits.filter(v => v.connection_status === 'New').length
  const repeatedVisits = visits.filter(v => v.connection_status === 'Repeated').length
  const otherVisits = totalVisits - newVisits - repeatedVisits


  const customTooltipStyle = { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#ffffff' }
  

  // Percentage bar component
  const PctBar = ({ value, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color, minWidth: '36px', textAlign: 'right' }}>{value}%</span>
    </div>
  )

  function AnimatedKPI({ label, value, sub, color, icon }) {
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
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.7 }} />
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
        {/* Icon + number row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <p style={{ fontSize: '32px', fontWeight: '800', color, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
            {display.toLocaleString()}
          </p>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            {icon}
          </div>
        </div>
        <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', margin: '0 0 2px 0' }}>{label}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{sub}</p>
      </div>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</p>
    </div>
  )

  return (
    <div style={{ color: '#ffffff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Deep dive into HTU outreach performance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/dashboard/analytics/previous-years" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#8b5cf6', cursor: 'pointer', textDecoration: 'none' }}>
            <BarChart2 size={16} /> Previous Years
          </a>
          <button onClick={() => window.open('/api/analytics/export', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Total Applicants', value: totalApplicants, sub: 'enrolled applicants', color: '#3b82f6', icon: '🎓' },
          { label: 'Completed Visits', value: totalVisits, sub: 'school visits done', color: '#f59e0b', icon: '🏫' },
          { label: 'Leads Collected', value: totalVisitStudents, sub: 'from all visits', color: '#f97316', icon: '📋' },
          { label: 'Contacts', value: totalContacts, sub: 'total contacts', color: '#ec4899', icon: '👥' },
        ].map(stat => (
          <AnimatedKPI key={stat.label} {...stat} />
        ))}
      </div>      

      {/* ── PERCENTAGE BREAKDOWN ROWS ── */}
      <div style={{ display: 'none' }}>

        {/* Visit Type Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 18px 0' }}>Visits by Type</p>
          {typeBreakdown.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>No data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {typeBreakdown.map((t, i) => {
                const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
                const color = COLORS[i % COLORS.length]
                return (
                  <div key={t.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t.name}</span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{t.count} visit{t.count !== 1 ? 's' : ''}</span>
                    </div>
                    <PctBar value={t.pct} color={color} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* School Type + Major top 5 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Private vs Public */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>School Type</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Private', count: privateCount, color: '#3b82f6' },
                { label: 'Public', count: publicCount, color: '#10b981' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{item.count} visit{item.count !== 1 ? 's' : ''}</span>
                  </div>
                  <PctBar value={pctNum(item.count, totalVisits)} color={item.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Top Majors */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>Top Majors (% of Applicants)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {majorData.slice(0, 5).map((m, i) => {
                const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
                return (
                  <div key={m.fullName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} title={m.fullName}>{m.name}</span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{m.value} applicant{m.value !== 1 ? 's' : ''}</span>
                    </div>
                    <PctBar value={m.pct} color={COLORS[i % COLORS.length]} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── VISIT BREAKDOWN CHART ── */}
      {(() => {
        const VISIT_COLORS = { 'School Tours': '#60a5fa', 'School Fairs': '#fbbf24', 'School visits at HTU Campus': '#34d399' }
        const allTypes = [...new Set(visits.map(v => v.type).filter(Boolean))]
        const allSchoolTypes = ['private', 'public']

        const filteredVisits = visits.filter(v =>
          (filters.type.length === 0 || filters.type.includes(v.type)) &&
          (filters.private_or_public.length === 0 || filters.private_or_public.includes(v.private_or_public))
        )

        const dataMap = {}
        filteredVisits.forEach(v => {
          if (!v.visit_date) return
          const dateObj = new Date(v.visit_date)
          const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
          const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })
          if (!dataMap[monthKey]) dataMap[monthKey] = { sortKey: monthKey, month: monthLabel, total: 0 }
          const t = v.type || 'Other'
          dataMap[monthKey][t] = (dataMap[monthKey][t] || 0) + 1
          dataMap[monthKey].total += 1
        })

        let cumulative = 0
        const chartData = Object.values(dataMap)
          .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
          .map(d => { cumulative += d.total; return { ...d, cumulative } })

        const activeTypes = allTypes.filter(t => chartData.some(d => d[t]))
        const maxTotal = Math.max(...chartData.map(d => d.total), 1)
        const peakMonth = chartData.reduce((a, b) => a.total > b.total ? a : b, chartData[0] || {})

        return (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '28px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>Visit Activity</p>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{filteredVisits.length} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '14px' }}>visits tracked</span></h2>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Monthly breakdown · stacked by visit type</p>
              </div>
              {/* Mini KPIs */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'Peak Month', value: peakMonth?.month || '—', sub: `${peakMonth?.total || 0} visits`, color: '#60a5fa' },
                  { label: 'Private', value: `${pctNum(visits.filter(v => v.private_or_public === 'private').length, totalVisits)}%`, sub: `${visits.filter(v => v.private_or_public === 'private').length} visits`, color: '#ec4899' },
                  { label: 'Public', value: `${pctNum(visits.filter(v => v.private_or_public === 'public').length, totalVisits)}%`, sub: `${visits.filter(v => v.private_or_public === 'public').length} visits`, color: '#06b6d4' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 16px', minWidth: '100px', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: k.color, borderRadius: '0 0 2px 2px', opacity: 0.7 }} />
                    <p style={{ fontSize: '18px', fontWeight: '800', color: k.color, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{k.value}</p>
                    <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', margin: '0 0 1px 0' }}>{k.label}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>{k.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>Filter:</span>
              {allTypes.map(val => {
                const color = VISIT_COLORS[val] || '#8b5cf6'
                const active = filters.type.includes(val)
                return (
                  <button key={val} onClick={() => toggleFilter('type', val)} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', borderColor: active ? color : 'rgba(255,255,255,0.08)', background: active ? `${color}20` : 'rgba(255,255,255,0.03)', color: active ? color : 'rgba(255,255,255,0.3)', transition: 'all 0.15s', fontWeight: active ? '600' : '400' }}>
                    {val}
                  </button>
                )
              })}
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
              {allSchoolTypes.map(val => {
                const color = val === 'private' ? '#ec4899' : '#06b6d4'
                const active = filters.private_or_public.includes(val)
                return (
                  <button key={val} onClick={() => toggleFilter('private_or_public', val)} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', textTransform: 'capitalize', borderColor: active ? color : 'rgba(255,255,255,0.08)', background: active ? `${color}20` : 'rgba(255,255,255,0.03)', color: active ? color : 'rgba(255,255,255,0.3)', transition: 'all 0.15s', fontWeight: active ? '600' : '400' }}>
                    {val}
                  </button>
                )
              })}
              {(filters.type.length > 0 || filters.private_or_public.length > 0) && (
                <button onClick={() => setFilters({ type: [], private_or_public: [], connection_status: [] })} style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171' }}>✕ Clear</button>
              )}
            </div>

            {chartData.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '60px 0' }}>No visits match these filters.</p>
            ) : (
              <>
                {/* Custom bar chart */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '200px', padding: '0 4px' }}>
                  {chartData.map((d, i) => {
                    const heightPct = (d.total / maxTotal) * 100
                    return (
                      <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                        title={`${d.month}: ${d.total} visits`}>
                        {/* Bar stack */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: `${heightPct}%`, minHeight: d.total > 0 ? '4px' : '0', borderRadius: '6px 6px 3px 3px', overflow: 'hidden', transition: 'height 0.6s ease', cursor: 'default' }}>
                          {activeTypes.map((t, ti) => {
                            const color = VISIT_COLORS[t] || '#8b5cf6'
                            const segPct = d.total > 0 ? ((d[t] || 0) / d.total) * 100 : 0
                            return (
                              <div key={t} style={{ width: '100%', height: `${segPct}%`, background: color, opacity: 0.85, minHeight: d[t] > 0 ? '3px' : '0', transition: 'height 0.4s ease' }} />
                            )
                          })}
                          {activeTypes.length === 0 && (
                            <div style={{ width: '100%', height: '100%', background: '#60a5fa', opacity: 0.7, borderRadius: '6px 6px 0 0' }} />
                          )}
                        </div>
                        {/* Count label */}
                        {d.total > 0 && (
                          <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', position: 'absolute', top: `calc(${100 - heightPct}% - 16px)` }}>{d.total}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* X axis labels */}
                <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 0', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {chartData.map(d => (
                    <div key={d.month} style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{d.month}</span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {activeTypes.map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: VISIT_COLORS[t] || '#8b5cf6', opacity: 0.85 }} />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{t}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>{chartData.reduce((s, d) => s + (d[t] || 0), 0)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })()}

{/* ── APPLICANTS BY MAJOR ── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Major</h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <RadialBarChart width={260} height={260} cx={130} cy={130} innerRadius={30} outerRadius={120}
              data={majorData.map((m, i) => ({ ...m, fill: ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316','#ec4899','#a78bfa','#34d399'][i % 9] }))}
              startAngle={90} endAngle={-270}>
              <RadialBar dataKey="pct" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Tooltip contentStyle={customTooltipStyle} content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{d.fullName}</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: d.fill }}>{d.count} applicants · {d.pct}%</p>
                  </div>
                )
              }} />
            </RadialBarChart>
            {/* Center label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-1px', color: '#fff' }}>{totalApplicants}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>total</p>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {majorData.map((m, i) => {
              const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316','#ec4899','#a78bfa','#34d399']
              const color = COLORS[i % COLORS.length]
              return (
                <div key={m.fullName} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}60` }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1 }}>{m.fullName}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{m.count}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>{m.pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── TOP PERFORMING SCHOOLS ── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performing Schools</h2>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{totalCompletedApplicants} total enrolled</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topSchools} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.55)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(value, name, props) => [`${props.payload.count} enrolled · ${props.payload.pct}%`, 'Share']} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} minPointSize={3} label={{ position: 'right', formatter: (v, entry) => `${topSchools.find(s => s.count === v)?.pct ?? ''}%`, fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
              {topSchools.map((s, i) => (
                <Cell key={s.name} fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3a' : '#3b82f6'} fillOpacity={1 - i * 0.07} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

{/* ── REPEAT VS NEW VISITS ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '28px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '20%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>School Engagement</p>
        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 24px 0', letterSpacing: '-0.5px' }}>{totalVisits} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '14px' }}>completed visits</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'New Schools', count: newVisits, color: '#3b82f6', desc: 'First-time outreach', icon: '✦' },
            { label: 'Repeated Schools', count: repeatedVisits, color: '#10b981', desc: 'Returning relationships', icon: '↻' },
            ...(otherVisits > 0 ? [{ label: 'Untagged', count: otherVisits, color: 'rgba(255,255,255,0.2)', desc: 'No status recorded', icon: '?' }] : [])
          ].map(item => (
            <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}20`, borderRadius: '16px', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: item.color, opacity: 0.5 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', color: item.color, opacity: 0.6 }}>{item.icon}</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: item.color, letterSpacing: '-1px' }}>{pctNum(item.count, totalVisits)}%</span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', margin: '0 0 2px 0' }}>{item.label}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px 0' }}>{item.desc}</p>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pctNum(item.count, totalVisits)}%`, height: '100%', background: item.color, borderRadius: '3px', transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '6px 0 0 0', textAlign: 'right' }}>{item.count} visits</p>
            </div>
          ))}
        </div>
        {/* Visual ratio strip */}
        <div style={{ height: '8px', borderRadius: '6px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
          <div style={{ width: `${pctNum(newVisits, totalVisits)}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '6px 0 0 6px', transition: 'width 1s ease' }} />
          <div style={{ width: `${pctNum(repeatedVisits, totalVisits)}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: otherVisits > 0 ? '0' : '0 6px 6px 0', transition: 'width 1s ease' }} />
          {otherVisits > 0 && <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '0 6px 6px 0' }} />}
        </div>
      </div>
    </div>
  )
}