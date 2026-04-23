'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_STYLES = {
  draft:       { dot: '#f5a623', bg: '#2a2a1a', border: '#3a2400',  color: '#f5a623',  label: 'Draft'       },
  in_progress: { dot: '#4f8ef7', bg: '#1a2030', border: '#1a2d52',  color: '#4f8ef7',  label: 'In Progress' },
  final:       { dot: '#3ecf8e', bg: '#0e3328', border: '#1a5c42',  color: '#3ecf8e',  label: 'Final'       },
}

const MODE_LABELS = {
  country:         'Country only',
  country_cities:  'Country + Cities',
  city_only:       'City only',
}

export default function MarketAnalysisPage() {
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetch('/api/market-analysis')
      .then(r => r.json())
      .then(d => { setReports(d.reports ?? []); setLoading(false) })
  }, [])

  async function handleDelete(e, report) {
    e.stopPropagation()
    if (!confirm(`Delete the ${report.country} report? This cannot be undone.`)) return
    setDeleting(report.id)
    await fetch('/api/market-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id: report.id, country: report.country } }),
    })
    setReports(prev => prev.filter(r => r.id !== report.id))
    setDeleting(null)
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#0d0d12', fontFamily: 'system-ui, sans-serif' }}>

      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#e8e8f0' }}>Market Analysis</div>
          <div style={{ fontSize: '12px', color: '#55556a', marginTop: '3px' }}>Market Studies · Dalia's Workspace</div>
        </div>
        <button
          onClick={() => router.push('/dashboard/market-analysis/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New report
        </button>
      </div>

      {/* loading */}
      {loading && (
        <div style={{ color: '#55556a', fontSize: '13px', paddingTop: '60px', textAlign: 'center' }}>Loading reports…</div>
      )}

      {/* empty */}
      {!loading && reports.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ fontSize: '15px', color: '#55556a', marginBottom: '12px' }}>No market reports yet</div>
          <button
            onClick={() => router.push('/dashboard/market-analysis/new')}
            style={{ padding: '9px 18px', borderRadius: '8px', background: '#1a2d52', border: '1px solid #2a4a80', color: '#4f8ef7', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Create your first report
          </button>
        </div>
      )}

      {/* cards grid */}
      {!loading && reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {reports.map(report => {
            const st = STATUS_STYLES[report.status] ?? STATUS_STYLES.draft
            return (
              <div
                key={report.id}
                onClick={() => router.push(`/dashboard/market-analysis/${report.id}`)}
                style={{ background: '#181824', border: '1px solid #ffffff0d', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer', transition: 'border-color .15s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2a4a80'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#ffffff0d'}
              >
                {/* country + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#e8e8f0' }}>{report.country}</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: st.bg, border: `1px solid ${st.border}`, color: st.color, flexShrink: 0, marginLeft: '10px' }}>
                    <svg width="6" height="6" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={st.dot}/></svg>
                    {st.label}
                  </span>
                </div>

                {/* mode + period */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: '#12121a', border: '1px solid #ffffff0d', color: '#9898b0' }}>
                    {MODE_LABELS[report.mode] ?? report.mode}
                  </span>
                  {(report.study_period_from || report.study_period_to) && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: '#12121a', border: '1px solid #ffffff0d', color: '#9898b0' }}>
                      {report.study_period_from ?? '?'} – {report.study_period_to ?? '?'}
                    </span>
                  )}
                  {report.education_level && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: '#12121a', border: '1px solid #ffffff0d', color: '#9898b0' }}>
                      {report.education_level}
                    </span>
                  )}
                </div>

                {/* prepared by + last updated */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #ffffff0d' }}>
                  <div style={{ fontSize: '11px', color: '#55556a' }}>
                    {report.prepared_by ? `By ${report.prepared_by}` : 'No author'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#55556a' }}>
                    {report.last_updated
                      ? new Date(report.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </div>
                </div>

                {/* delete button */}
                <button
                  onClick={e => handleDelete(e, report)}
                  disabled={deleting === report.id}
                  style={{ position: 'absolute', top: '1px', right: '5.5px', background: 'none', border: 'none', cursor: 'pointer', color: '#55556a', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f06595'}
                  onMouseLeave={e => e.currentTarget.style.color = '#55556a'}
                  title="Delete report"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}