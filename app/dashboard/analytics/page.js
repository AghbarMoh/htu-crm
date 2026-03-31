'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Filter, ChevronDown, ChevronUp } from 'lucide-react'

export default function AnalyticsPage() {
  const [applicants, setApplicants] = useState([])
  const [visits, setVisits] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // --- NEW FILTER & GROUPING STATE ---
  const [activeGrouping, setActiveGrouping] = useState([]) // dimensions to split the bars
  const [filters, setFilters] = useState({
    type: [],
    private_or_public: [],
    connection_status: []
  })
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [a, v, vs, c] = await Promise.all([
      supabase.from('applicants').select('*'),
      // Matches your existing logic to only include completed visits
      supabase.from('school_visits').select('*, visit_completions!inner(visit_id)'),
      supabase.from('visit_students').select('*'),
      supabase.from('contacts').select('*'),
    ])
    if (!a.error) setApplicants(a.data)
    if (!v.error) {
      setVisits(v.data)
      // Initialize filters with all unique values found in data
      const uniqueTypes = [...new Set(v.data.map(item => item.type))].filter(Boolean)
      setFilters({
        type: uniqueTypes,
        private_or_public: ['private', 'public'],
        connection_status: ['New', 'Repeated']
      })
    }
    if (!vs.error) setVisitStudents(vs.data)
    if (!c.error) setContacts(c.data)
    setLoading(false)
  }

  // Toggle dimension for grouping (e.g. split bars by status)
  const toggleGrouping = (dim) => {
    setActiveGrouping(prev => 
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    )
  }

  // Toggle specific values for filtering (e.g. uncheck 'private')
  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }))
  }

  // Summary Metrics
  const totalApplicants = applicants.length
  const matchedApplicants = applicants.filter(a => a.is_matched).length
  const totalVisits = visits.length
  const totalVisitStudents = visitStudents.length
  const totalContacts = contacts.length
  const newVisitsCount = visits.filter(v => v.connection_status === 'New' || !v.connection_status).length
  const repeatedVisitsCount = visits.filter(v => v.connection_status === 'Repeated').length

  const majorCounts = {}
  applicants.forEach(a => { if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1 })
  const majorData = Object.entries(majorCounts).map(([name, value]) => ({ 
    name: name.length > 15 ? name.slice(0, 15) + '...' : name, 
    value 
  })).sort((a, b) => b.value - a.value)

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ['Total Applicants', totalApplicants], ['Matched', matchedApplicants], ['Completed Visits', totalVisits], ['Visit Students', totalVisitStudents], ['Contacts', totalContacts]]), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Major', 'Count'], ...Object.entries(majorCounts)]), 'Majors')
    XLSX.writeFile(wb, 'HTU_Analytics_Report.xlsx')
  }

  const handleExportBreakdown = async (filteredVisits, chartKeys) => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const dataMap = {}
    
    filteredVisits.forEach(v => {
      const month = new Date(v.visit_date).toLocaleString('default', { month: 'short', year: 'numeric' })
      const groupKey = activeGrouping.length === 0 ? 'Total' : activeGrouping.map(d => v[d] || 'N/A').join(' - ')
      if (!dataMap[month]) dataMap[month] = { Month: month }
      dataMap[month][groupKey] = (dataMap[month][groupKey] || 0) + 1
    })

    const rows = Object.values(dataMap)
    const ws = XLSX.utils.aoa_to_sheet([['Month', ...chartKeys], ...rows.map(r => [r.Month, ...chartKeys.map(k => r[k] || 0)])])
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Breakdown')
    XLSX.writeFile(wb, 'HTU_Visits_Filtered_Report.xlsx')
  }

  const customTooltipStyle = { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#ffffff' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}><p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</p></div>

  return (
    <div style={{ color: '#ffffff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Deep dive into HTU outreach performance</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
          <Download size={16} />
          Export All
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Applicants', value: totalApplicants, color: '#3b82f6' },
          { label: 'Matched with Visits', value: matchedApplicants, color: '#8b5cf6' },
          { label: 'Conversion Rate', value: totalVisitStudents > 0 ? Math.round((matchedApplicants / totalVisitStudents) * 100) + '%' : '0%', color: '#06b6d4' },
          { label: 'Completed Visits', value: totalVisits, color: '#f59e0b' },
          { label: 'New Schools', value: newVisitsCount, color: '#10b981' },
          { label: 'Repeated Schools', value: repeatedVisitsCount, color: '#8b5cf6' },
          { label: 'Visit Students', value: totalVisitStudents, color: '#f97316' },
          { label: 'Contacts', value: totalContacts, color: '#ec4899' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '24px', fontWeight: '700', color: stat.color, margin: '0 0 4px 0' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* --- CUSTOM BREAKDOWN CHART WITH LIVE FILTER HUB --- */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
        
        {/* Hub Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed Visits Breakdown
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Mix and match filters to find specific trends</p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
          >
            <Filter size={14} />
            {showFilters ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>

        {showFilters && (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              
              {/* Group By Selector */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', marginBottom: '12px', textTransform: 'uppercase' }}>1. Split Bars By</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Visit Type', key: 'type' },
                    { label: 'School Type', key: 'private_or_public' },
                    { label: 'Connection Status', key: 'connection_status' }
                  ].map(dim => (
                    <label key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: activeGrouping.includes(dim.key) ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
                      <input type="checkbox" checked={activeGrouping.includes(dim.key)} onChange={() => toggleGrouping(dim.key)} style={{ cursor: 'pointer' }} />
                      {dim.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters: Status */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', textTransform: 'uppercase' }}>2. Filter Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['New', 'Repeated'].map(val => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: filters.connection_status.includes(val) ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>
                      <input type="checkbox" checked={filters.connection_status.includes(val)} onChange={() => toggleFilter('connection_status', val)} />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters: School Type */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', textTransform: 'uppercase' }}>3. Filter School Type</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['private', 'public'].map(val => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: filters.private_or_public.includes(val) ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>
                      <input type="checkbox" checked={filters.private_or_public.includes(val)} onChange={() => toggleFilter('private_or_public', val)} />
                      <span style={{ textTransform: 'capitalize' }}>{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters: Visit Type */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', textTransform: 'uppercase' }}>4. Filter Visit Type</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {[...new Set(visits.map(v => v.type))].map(val => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', color: filters.type.includes(val) ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>
                      <input type="checkbox" checked={filters.type.includes(val)} onChange={() => toggleFilter('type', val)} />
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(() => {
          // --- CHART DATA PROCESSING ---
          const dataMap = {}
          const keys = new Set()
          
          // 1. Filter the visits based on checklist selections
          const filteredVisits = visits.filter(v => 
            filters.connection_status.includes(v.connection_status || 'New') &&
            filters.private_or_public.includes(v.private_or_public) &&
            filters.type.includes(v.type)
          )

          // 2. Process data for Recharts
          filteredVisits.forEach(v => {
            if (!v.visit_date) return
            const dateObj = new Date(v.visit_date)
            const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
            const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' })
            
            // Merged key logic: Combine all active dimensions into one label (e.g. "Repeated - Public")
            const groupKey = activeGrouping.length === 0 
              ? 'Total Visits' 
              : activeGrouping.map(dim => v[dim] || 'N/A').join(' - ')
              
            keys.add(groupKey)

            if (!dataMap[monthKey]) dataMap[monthKey] = { sortKey: monthKey, month: monthLabel }
            dataMap[monthKey][groupKey] = (dataMap[monthKey][groupKey] || 0) + 1
          })

          const chartData = Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
          const chartKeys = Array.from(keys)
          const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button onClick={() => handleExportBreakdown(filteredVisits, chartKeys)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
                  ↓ Export Filtered Data
                </button>
              </div>
              
              {chartData.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '60px 0' }}>No visits match these filters.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                    <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                    {chartKeys.map((key, index) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} radius={index === chartKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )
        })()}
      </div>

      {/* Applicants by Major Chart */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Major</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={majorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}