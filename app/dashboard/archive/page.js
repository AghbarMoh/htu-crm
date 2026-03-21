'use client'
import { logActivity } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

export default function ArchivePage() {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedLabel, setExpandedLabel] = useState(null)
  const supabase = createClient()

  useEffect(() => { fetchArchives() }, [])

  const fetchArchives = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('is_archived', true)
      .order('archived_at', { ascending: false })
    if (!error) {
      // Group by archive_label
      const grouped = {}
      data.forEach(a => {
        const label = a.archive_label || 'Unlabeled'
        if (!grouped[label]) grouped[label] = { label, date: a.archived_at, applicants: [] }
        grouped[label].applicants.push(a)
      })
      setArchives(Object.values(grouped))
    }
    setLoading(false)
  }

  const filteredArchives = archives.map(archive => ({
    ...archive,
    applicants: archive.applicants.filter(a =>
      !search ||
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.phone?.includes(search) ||
      a.major?.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(archive => !search || archive.applicants.length > 0)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' },
    th: { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' },
    td: { padding: '10px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
  }

  const totalArchived = archives.reduce((sum, a) => sum + a.applicants.length, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Archive</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {archives.length} batches — {totalArchived} total archived applicants
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search across all archives by name, email, phone or major..."
          style={{ ...s.input, paddingLeft: '36px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>Loading...</div>
      ) : filteredArchives.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>No archived applicants found</div>
      ) : (
        filteredArchives.map((archive) => (
          <div key={archive.label} style={s.card}>
            {/* Archive Header */}
            <div
              onClick={() => setExpandedLabel(expandedLabel === archive.label ? null : archive.label)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  📁
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: '0 0 2px 0' }}>{archive.label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {archive.applicants.length} applicants — {archive.date ? new Date(archive.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    {archive.applicants.filter(a => a.paid).length} paid
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    {archive.applicants.filter(a => !a.paid).length} not paid
                  </span>
                </div>
                <button
                 onClick={async (e) => {
                    e.stopPropagation()
                    if (!confirm('Delete this entire archive batch?')) return
                    const ids = archive.applicants.map(a => a.id)
                    await supabase.from('applicants').delete().in('id', ids)
                    await logActivity('Deleted archive batch', 'archive', archive.label, 'Deleted ' + archive.applicants.length + ' archived applicants')
                    fetchArchives()
                  }}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: '#ef4444', cursor: 'pointer' }}
                >
                  Delete
                </button>
                {expandedLabel === archive.label ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
              </div>
            </div>

            {/* Archive Table */}
            {expandedLabel === archive.label && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr>
                      {['Name', 'Phone', 'Email', 'Nationality', 'Major', 'Semester', 'Year', 'Paid', 'Sign Up Date', 'Notes', 'Matched'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {archive.applicants.map((applicant) => (
                      <tr key={applicant.id}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{applicant.full_name}</td>
                        <td style={s.td}>{applicant.phone || '-'}</td>
                        <td style={s.td}>{applicant.email || '-'}</td>
                        <td style={s.td}>{applicant.nationality || '-'}</td>
                        <td style={s.td}>{applicant.major || '-'}</td>
                        <td style={s.td}>{applicant.semester || '-'}</td>
                        <td style={s.td}>{applicant.year || '-'}</td>
                        <td style={s.td}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: applicant.paid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: applicant.paid ? '#10b981' : '#ef4444' }}>
                            {applicant.paid ? 'Paid' : 'Not Paid'}
                          </span>
                        </td>
                        <td style={s.td}>{applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : '-'}</td>
                        <td style={{ ...s.td, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{applicant.notes || '-'}</td>
                        <td style={s.td}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: applicant.is_matched ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', color: applicant.is_matched ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
                            {applicant.is_matched ? '✓ Matched' : 'No match'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}