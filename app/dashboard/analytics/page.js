'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell, LabelList } from 'recharts'
import { Download, Filter } from 'lucide-react'

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
        const completedVisits = (data.visits || []).filter(visit =>
          (data.completions || []).some(comp => comp.visit_id === visit.id)
        )
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
  const totalApplicants = applicants.length
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
        <button onClick={() => window.open('/api/analytics/export', '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Raw counts */}
        {[
          { label: 'Total Applicants', value: totalApplicants, sub: '100% baseline', color: '#3b82f6' },
          { label: 'Completed Visits', value: totalVisits, sub: '100% baseline', color: '#f59e0b' },
          { label: 'Leads', value: totalVisitStudents, sub: 'total leads collected', color: '#f97316' },
          { label: 'Contacts', value: totalContacts, sub: 'total contacts', color: '#ec4899' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 18px' }}>
            <p style={{ fontSize: '26px', fontWeight: '700', color: stat.color, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px 0', fontWeight: '500' }}>{stat.label}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>{stat.sub}</p>
          </div>
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

        return (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visit Activity</h2>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>{filteredVisits.length} visits · bars by type · line shows cumulative growth</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {allTypes.map(val => {
                  const color = VISIT_COLORS[val] || '#8b5cf6'
                  const active = filters.type.includes(val)
                  return (
                    <button key={val} onClick={() => toggleFilter('type', val)} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', borderColor: active ? color : 'rgba(255,255,255,0.1)', background: active ? `${color}22` : 'transparent', color: active ? color : 'rgba(255,255,255,0.3)', transition: 'all 0.15s' }}>
                      {val}
                    </button>
                  )
                })}
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
                {allSchoolTypes.map(val => {
                  const color = val === 'private' ? '#ec4899' : '#06b6d4'
                  const active = filters.private_or_public.includes(val)
                  return (
                    <button key={val} onClick={() => toggleFilter('private_or_public', val)} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', textTransform: 'capitalize', borderColor: active ? color : 'rgba(255,255,255,0.1)', background: active ? `${color}22` : 'transparent', color: active ? color : 'rgba(255,255,255,0.3)', transition: 'all 0.15s' }}>
                      {val}
                    </button>
                  )
                })}
                {(filters.type.length > 0 || filters.private_or_public.length > 0) && (
                  <button onClick={() => setFilters({ type: [], private_or_public: [], connection_status: [] })} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>✕ Clear</button>
                )}
              </div>
            </div>

            {chartData.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '60px 0' }}>No visits match these filters.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      formatter={(value, name) => [`${value} visits (${Math.round(value / filteredVisits.length * 100)}%)`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '16px', color: 'rgba(255,255,255,0.4)' }} />
                    {activeTypes.map((t, i) => (
                      <Bar key={t} yAxisId="left" dataKey={t} stackId="stack" fill={VISIT_COLORS[t] || '#8b5cf6'} radius={i === activeTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={48} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )
      })()}

      {/* ── APPLICANTS BY MAJOR ── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Major</h2>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            <RadialBarChart width={260} height={260} cx={130} cy={130} innerRadius={30} outerRadius={120} data={majorData.map((m, i) => ({ ...m, fill: ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316','#ec4899','#a78bfa','#34d399'][i % 9] }))} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="pct" cornerRadius={4} background={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Tooltip contentStyle={customTooltipStyle} content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#ffffff' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.5)' }}>{d.fullName}</p>
                    <p style={{ margin: 0, fontWeight: '700' }}>{d.count} applicants · {d.pct}%</p>
                  </div>
                )
              }} />
            </RadialBarChart>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {majorData.map((m, i) => {
              const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316','#ec4899','#a78bfa','#34d399']
              const color = COLORS[i % COLORS.length]
              return (
                <div key={m.fullName} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1 }}>{m.fullName}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{m.count}</span>
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
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repeat vs New School Engagement</h2>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{totalVisits} completed visits</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            <PieChart width={200} height={200}>
              <Pie data={[
                { name: 'New Schools', value: newVisits },
                { name: 'Repeated Schools', value: repeatedVisits },
                ...(otherVisits > 0 ? [{ name: 'Untagged', value: otherVisits }] : [])
              ]} cx={100} cy={100} innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                {otherVisits > 0 && <Cell fill="rgba(255,255,255,0.15)" />}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} formatter={(value) => [`${value} visits · ${pctNum(value, totalVisits)}%`]} />
            </PieChart>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'New Schools', count: newVisits, color: '#3b82f6', desc: 'First-time outreach visits' },
              { label: 'Repeated Schools', count: repeatedVisits, color: '#10b981', desc: 'Returning relationship visits' },
              ...(otherVisits > 0 ? [{ label: 'Untagged', count: otherVisits, color: 'rgba(255,255,255,0.2)', desc: 'No status recorded' }] : [])
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{pctNum(item.count, totalVisits)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{item.desc}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{item.count} visits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}