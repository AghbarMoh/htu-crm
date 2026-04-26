'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'

const s = {
  td: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' },
  th: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', padding: '0 0 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 22px' },
}

export default function OpenDayDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [openDay, setOpenDay] = useState(null)
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/open-day?id=${id}`)
      const json = await res.json()
      if (json.openDay) setOpenDay(json.openDay)
      if (json.visitors) setVisitors(json.visitors)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) fetchData() }, [id])

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatDateTime = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const exportCSV = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'Date of Birth', 'Cause of Visit', 'Feedback', 'Submitted At']
    const rows = visitors.map(v => [
      v.full_name, v.phone || '', v.email || '',
      v.date_of_birth || '', v.cause_of_visit || '',
      (v.feedback || '').replace(/,/g, ';'), formatDateTime(v.submitted_at)
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${openDay?.label || 'open-day'}-visitors.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* UPDATED BACK BUTTON ROUTE HERE */}
          <button onClick={() => router.push('/dashboard/sop/open-day')}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.4px' }}>
              {loading ? 'Loading...' : openDay?.label || 'Open Day'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
              {openDay ? formatDate(openDay.event_date) : ''} · {visitors.length} visitor{visitors.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {visitors.length > 0 && (
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.25)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#3ecf8e', cursor: 'pointer' }}>
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Loading...</div>
        ) : visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
            No visitors have submitted yet for this open day.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Full Name', 'Phone', 'Email', 'Date of Birth', 'Cause of Visit', 'Feedback', 'Submitted At'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, i) => (
                  <tr key={v.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...s.td, color: 'rgba(255,255,255,0.25)', width: '36px' }}>{i + 1}</td>
                    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{v.full_name}</td>
                    <td style={s.td}>{v.phone || '-'}</td>
                    <td style={s.td}>{v.email || '-'}</td>
                    <td style={s.td}>{v.date_of_birth ? formatDate(v.date_of_birth) : '-'}</td>
                    <td style={s.td}>
                      <span style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '6px', padding: '3px 9px', fontSize: '12px', color: '#4f8ef7' }}>
                        {v.cause_of_visit || '-'}
                      </span>
                    </td>
                    <td style={{ ...s.td, maxWidth: '220px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.feedback}>
                        {v.feedback || '-'}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateTime(v.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}