'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download } from 'lucide-react'


export default function AnalyticsPage() {
  const [applicants, setApplicants] = useState([])
  const [visits, setVisits] = useState([])
  const [visitStudents, setVisitStudents] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])



  const fetchAll = async () => {
    setLoading(true)
    const [a, v, vs, c] = await Promise.all([
      supabase.from('applicants').select('*'),
      supabase.from('school_visits').select('*'),
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
  const paidApplicants = applicants.filter(a => a.paid).length
  const notPaidApplicants = applicants.filter(a => !a.paid).length
  const matchedApplicants = applicants.filter(a => a.is_matched).length
  const totalVisits = visits.length
  const totalVisitStudents = visitStudents.length
  const totalContacts = contacts.length
  const newVisitsCount = visits.filter(v => v.connection_status === 'New' || !v.connection_status).length;
  const repeatedVisitsCount = visits.filter(v => v.connection_status === 'Repeated').length;

  const majorCounts = {}
  applicants.forEach(a => { if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1 })
  const majorData = Object.entries(majorCounts).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value })).sort((a, b) => b.value - a.value)

  const heardCounts = {}
  applicants.forEach(a => { if (a.heard_about_htu) heardCounts[a.heard_about_htu] = (heardCounts[a.heard_about_htu] || 0) + 1 })
  const heardData = Object.entries(heardCounts).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  const nationalityCounts = {}
  applicants.forEach(a => { if (a.nationality) nationalityCounts[a.nationality] = (nationalityCounts[a.nationality] || 0) + 1 })
  const nationalityData = Object.entries(nationalityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  const visitMonths = {}
  visits.forEach(v => { if (v.visit_date) { const month = v.visit_date.slice(0, 7); visitMonths[month] = (visitMonths[month] || 0) + 1 } })
  const visitsPerMonth = Object.entries(visitMonths).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))

  const jordanVisits = visits.filter(v => v.type === 'jordan_tour').length
  const intlVisits = visits.filter(v => v.type === 'international_fair').length
  const visitTypeData = [{ name: 'Jordan Tours', value: jordanVisits }, { name: 'International Fairs', value: intlVisits }]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  const handleExport = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ['Total Applicants', totalApplicants], ['Paid', paidApplicants], ['Not Paid', notPaidApplicants], ['Matched', matchedApplicants], ['School Visits', totalVisits], ['Visit Students', totalVisitStudents], ['Contacts', totalContacts]]), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Major', 'Count'], ...Object.entries(majorCounts)]), 'Majors')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Source', 'Count'], ...Object.entries(heardCounts)]), 'How Heard')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nationality', 'Count'], ...Object.entries(nationalityCounts)]), 'Nationalities')
    XLSX.writeFile(wb, 'HTU_Analytics_Report.xlsx')
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Applicants', value: totalApplicants, color: '#3b82f6' },
          { label: 'Paid', value: paidApplicants, color: '#10b981' },
          { label: 'Matched with Visits', value: matchedApplicants, color: '#8b5cf6' },
          { label: 'Conversion Rate', value: totalVisitStudents > 0 ? Math.round((matchedApplicants / totalVisitStudents) * 100) + '%' : '0%', color: '#06b6d4' },
          { label: 'School Visits', value: totalVisits, color: '#f59e0b' },
          { label: 'New Schools', value: newVisitsCount, color: '#10b981' },
          { label: 'Repeated Schools', value: repeatedVisitsCount, color: '#8b5cf6' },
          { label: 'Visit Students', value: totalVisitStudents, color: '#f97316' },
          { label: 'Contacts', value: totalContacts, color: '#ec4899' },
          { label: 'Not Paid', value: notPaidApplicants, color: '#ef4444' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '24px', fontWeight: '700', color: stat.color, margin: '0 0 4px 0' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Major</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={majorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How Students Heard About HTU</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={heardData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} width={120} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>School Visits per Month</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={visitsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visit Types</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={visitTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {visitTypeData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {visitTypeData.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nationality Chart */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicants by Nationality (Top 6)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={nationalityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* School Conversion Table */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginTop: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>School Visit Conversion</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['School Name', 'Students Visited', 'Applied', 'Paid', 'Conversion Rate'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const schoolMap = {}
                visits.forEach(v => {
                  if (!schoolMap[v.school_name]) schoolMap[v.school_name] = { name: v.school_name, visited: 0, applied: 0, paid: 0 }
                })
                visitStudents.forEach(vs => {
                  const visit = visits.find(v => v.id === vs.visit_id)
                  if (visit) {
                    if (!schoolMap[visit.school_name]) schoolMap[visit.school_name] = { name: visit.school_name, visited: 0, applied: 0, paid: 0 }
                    schoolMap[visit.school_name].visited++
                    if (vs.is_matched) {
                      schoolMap[visit.school_name].applied++
                      const matchedApplicant = applicants.find(a => a.id === vs.matched_applicant_id)
                      if (matchedApplicant?.paid) schoolMap[visit.school_name].paid++
                    }
                  }
                })
                const rows = Object.values(schoolMap).sort((a, b) => b.visited - a.visited)
                if (rows.length === 0) return (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>No school visit data yet</td></tr>
                )
                return rows.map((row) => (
                  <tr key={row.name}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#ffffff', fontWeight: '500', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.visited}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{row.applied}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{row.paid}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                          <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', width: row.visited > 0 ? Math.round((row.applied / row.visited) * 100) + '%' : '0%' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', minWidth: '35px' }}>
                          {row.visited > 0 ? Math.round((row.applied / row.visited) * 100) + '%' : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
  )
}