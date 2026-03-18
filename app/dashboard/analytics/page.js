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

  useEffect(() => {
    fetchAll()
  }, [])

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

  // Stats
  const totalApplicants = applicants.length
  const paidApplicants = applicants.filter(a => a.paid).length
  const notPaidApplicants = applicants.filter(a => !a.paid).length
  const matchedApplicants = applicants.filter(a => a.is_matched).length
  const totalVisits = visits.length
  const totalVisitStudents = visitStudents.length
  const totalContacts = contacts.length

  // Major distribution
  const majorCounts = {}
  applicants.forEach(a => {
    if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1
  })
  const majorData = Object.entries(majorCounts)
    .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }))
    .sort((a, b) => b.value - a.value)

  // How heard about HTU
  const heardCounts = {}
  applicants.forEach(a => {
    if (a.heard_about_htu) heardCounts[a.heard_about_htu] = (heardCounts[a.heard_about_htu] || 0) + 1
  })
  const heardData = Object.entries(heardCounts)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Nationality distribution
  const nationalityCounts = {}
  applicants.forEach(a => {
    if (a.nationality) nationalityCounts[a.nationality] = (nationalityCounts[a.nationality] || 0) + 1
  })
  const nationalityData = Object.entries(nationalityCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Visits per month
  const visitMonths = {}
  visits.forEach(v => {
    if (v.visit_date) {
      const month = v.visit_date.slice(0, 7)
      visitMonths[month] = (visitMonths[month] || 0) + 1
    }
  })
  const visitsPerMonth = Object.entries(visitMonths)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Jordan vs International
  const jordanVisits = visits.filter(v => v.type === 'jordan_tour').length
  const intlVisits = visits.filter(v => v.type === 'international_fair').length
  const visitTypeData = [
    { name: 'Jordan Tours', value: jordanVisits },
    { name: 'International Fairs', value: intlVisits },
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

  const handleExport = async () => {
    const XLSX = await import('xlsx')

    const wb = XLSX.utils.book_new()

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Applicants', totalApplicants],
      ['Paid Applicants', paidApplicants],
      ['Not Paid Applicants', notPaidApplicants],
      ['Matched with School Visits', matchedApplicants],
      ['Total School Visits', totalVisits],
      ['Total Visit Students', totalVisitStudents],
      ['Total Contacts', totalContacts],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

    const majorSheet = [['Major', 'Count'], ...Object.entries(majorCounts)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(majorSheet), 'Majors')

    const heardSheet = [['Source', 'Count'], ...Object.entries(heardCounts)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(heardSheet), 'How Heard')

    const nationalitySheet = [['Nationality', 'Count'], ...Object.entries(nationalityCounts)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(nationalitySheet), 'Nationalities')

    XLSX.writeFile(wb, 'HTU_Analytics_Report.xlsx')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all outreach data</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applicants', value: totalApplicants, color: 'bg-blue-50 text-blue-700' },
          { label: 'Paid', value: paidApplicants, color: 'bg-green-50 text-green-700' },
          { label: 'Not Paid', value: notPaidApplicants, color: 'bg-red-50 text-red-700' },
          { label: 'Matched with Visits', value: matchedApplicants, color: 'bg-purple-50 text-purple-700' },
          { label: 'School Visits', value: totalVisits, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Visit Students', value: totalVisitStudents, color: 'bg-orange-50 text-orange-700' },
          { label: 'Contacts', value: totalContacts, color: 'bg-pink-50 text-pink-700' },
          { label: 'Conversion Rate', value: totalVisitStudents > 0 ? Math.round((matchedApplicants / totalVisitStudents) * 100) + '%' : '0%', color: 'bg-indigo-50 text-indigo-700' },
        ].map((stat) => (
          <div key={stat.label} className={"rounded-xl p-4 " + stat.color}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm mt-1 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Major Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Applicants by Major</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={majorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* How Heard About HTU */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">How Students Heard About HTU</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={heardData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Visits per Month */}
        <div className="bg-white rounded-xl shadow-sm p-4 col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">School Visits per Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={visitsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visit Type Pie */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Visit Types</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={visitTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => name + ': ' + value}
              >
                {visitTypeData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nationality Chart */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Applicants by Nationality (Top 6)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={nationalityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}