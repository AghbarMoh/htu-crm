'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download } from 'lucide-react'


export default function AnalyticsPage() {
  const [applicants, setApplicants] = useState([])
  const [visits, setVisits] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [visitBreakdownFilter, setVisitBreakdownFilter] = useState('general') // default filter

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [a, v, vs, c] = await Promise.all([
      supabase.from('applicants').select('*'),
      supabase.from('school_visits').select('*, visit_completions!inner(visit_id)'),
      supabase.from('visit_students').select('*'),
      supabase.from('contacts').select('*'),
    ])
    if (!a.error) setApplicants(a.data)
    if (!v.error) setVisits(v.data)
    if (!vs.error) setVisitStudents(vs.data)
    if (!c.error) setContacts(c.data)
    setLoading(false)
  }

  const totalApplicants = applicants.length
  const matchedApplicants = applicants.filter(a => a.is_matched).length
  const totalVisits = visits.length
  const totalVisitStudents = visitStudents.length
  const totalContacts = contacts.length
  const newVisitsCount = visits.filter(v => v.connection_status === 'New' || !v.connection_status).length;
  const repeatedVisitsCount = visits.filter(v => v.connection_status === 'Repeated').length;

  const majorCounts = {}
  applicants.forEach(a => { if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1 })
  const majorData = Object.entries(majorCounts).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value })).sort((a, b) => b.value - a.value)


  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ['Total Applicants', totalApplicants], ['Matched', matchedApplicants], ['Completed Visits', totalVisits], ['Visit Students', totalVisitStudents], ['Contacts', totalContacts]]), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Major', 'Count'], ...Object.entries(majorCounts)]), 'Majors')
    XLSX.writeFile(wb, 'HTU_Analytics_Report.xlsx')
  }
  const handleExportBreakdown = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    
    const dataMap = {}
    const categories = new Set()
    
    visits.forEach(v => {
      if (!v.visit_date) return
      const dateObj = new Date(v.visit_date)
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
      const groupKey = visitBreakdownFilter === 'general' ? 'Total Visits' : (v[visitBreakdownFilter] || 'Unknown')
      categories.add(groupKey)

      if (!dataMap[monthKey]) dataMap[monthKey] = { Month: monthKey }
      dataMap[monthKey][groupKey] = (dataMap[monthKey][groupKey] || 0) + 1
    })

    const chartKeys = Array.from(categories)
    const rows = Object.values(dataMap).sort((a, b) => a.Month.localeCompare(b.Month))
    
    const worksheetData = [
      ['Month', ...chartKeys],
      ...rows.map(row => [row.Month, ...chartKeys.map(k => row[k] || 0)])
    ]

    const ws = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(wb, ws, 'Visits Breakdown')
    XLSX.writeFile(wb, `HTU_Visits_Breakdown_${visitBreakdownFilter}.xlsx`)
  }

  const customTooltipStyle = { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#ffffff' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}><p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</p></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Overview of all outreach data</p>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#10b981', cursor: 'pointer' }}>
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      {/* Stats */}
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

      {/* Dynamic Completed Visits Analysis Chart (MOVED TO TOP) */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Completed Visits Breakdown
            </h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Monthly analysis of all accomplished visits</p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleExportBreakdown}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#60a5fa', cursor: 'pointer' }}
            >
              <Download size={14} />
              Export Breakdown
            </button>
            <select 
              value={visitBreakdownFilter} 
              onChange={(e) => setVisitBreakdownFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#ffffff', outline: 'none', cursor: 'pointer' }}
            >
              <option value="general">In General (Total Visits)</option>
              <option value="type">Group by Visit Type</option>
              <option value="private_or_public">Group by School Type (Private/Public)</option>
              <option value="connection_status">Group by Status (New/Repeated)</option>
            </select>
          </div>
        </div>

        {(() => {
          // 1. Process data based on the selected filter
          const dataMap = {};
          const keys = new Set();
          
          visits.forEach(v => {
            if (!v.visit_date) return;
            const dateObj = new Date(v.visit_date);
            const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            // Get the value based on the dropdown (e.g. 'School Fairs', 'Private', 'New')
            const groupKey = visitBreakdownFilter === 'general' ? 'Total Visits' : (v[visitBreakdownFilter] || 'Unknown');
            keys.add(groupKey);

            if (!dataMap[monthKey]) {
              dataMap[monthKey] = { sortKey: monthKey, month: monthLabel };
            }
            dataMap[monthKey][groupKey] = (dataMap[monthKey][groupKey] || 0) + 1;
          });

          const chartData = Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
          const chartKeys = Array.from(keys);
          const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

          // 2. Render the Chart
          return chartData.length === 0 ? (
             <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>No completed visits to display.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', paddingTop: '10px' }} />
                
                {/* Dynamically create stacked bars based on the available categories */}
                {chartKeys.map((key, index) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]} 
                    radius={index === chartKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </div>

      {/* Bottom Chart Row (Applicants by Major) */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Major</h2>
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