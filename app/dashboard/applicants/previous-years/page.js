'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, Users, Calendar, ChevronRight, X, Loader2, GraduationCap, Trash2 } from 'lucide-react'

export default function PreviousYearsPage() {
  const router = useRouter()
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newYear, setNewYear] = useState('')

  // Import state
  const [importingId, setImportingId] = useState(null)
  const [importingYear, setImportingYear] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { fetchCohorts() }, [])

  const fetchCohorts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/previous-years')
      const data = await res.json()
      setCohorts(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const createCohort = async () => {
    if (!newLabel.trim() || !newYear.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/previous-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim(), year: parseInt(newYear) })
      })
      if (res.ok) {
        setShowCreate(false)
        setNewLabel('')
        setNewYear('')
        fetchCohorts()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const handleImport = async () => {
    if (!importFile || !importingYear) return
    setImporting(true)
    setImportResult(null)
    try {
      const form = new FormData()
      form.append('file', importFile)
      form.append('year', importingYear) // <-- We explicitly attach the year to the payload here
      
      const res = await fetch(`/api/previous-years/${importingYear}/import`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      setImportResult(data)
      if (data.success) fetchCohorts()
    } catch (e) {
      setImportResult({ error: e.message })
    } finally {
      setImporting(false)
    }
  }

  const openImport = (cohort) => {
    setImportingId(cohort.id)
    setImportingYear(cohort.year)
    setImportFile(null)
    setImportResult(null)
  }

  const closeImport = () => {
    setImportingId(null)
    setImportingYear(null)
    setImportFile(null)
    setImportResult(null)
  }

  const DEGREE_COLORS = {
    'Bachelor':           '#3b82f6',
    'Technical':          '#f59e0b',
    'Technician':         '#10b981',
    'Unspecified Degree': 'rgba(255,255,255,0.2)',
  }

  const cardAccents = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316']

  return (
    <div style={{ color: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Previous Years
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Import and explore historical applicant cohorts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '10px', padding: '10px 18px', fontSize: '13px',
            fontWeight: '600', color: '#3b82f6', cursor: 'pointer'
          }}
        >
          <Plus size={15} /> New Year
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading cohorts...</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && cohorts.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '280px', background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', gap: '12px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={22} color="#3b82f6" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No cohorts yet</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Create your first year to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '8px', padding: '8px 16px', fontSize: '12px',
              fontWeight: '600', color: '#3b82f6', cursor: 'pointer'
            }}
          >
            <Plus size={13} /> Create Year
          </button>
        </div>
      )}

      {/* ── Cohort Grid ── */}
      {!loading && cohorts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {cohorts.map((cohort, i) => {
            const accent = cardAccents[i % cardAccents.length]
            return (
              <div
                key={cohort.id}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '18px', padding: '20px', position: 'relative', overflow: 'hidden',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: '20px', right: '20px',
                  height: '2px', background: accent, borderRadius: '0 0 4px 4px', opacity: 0.7
                }} />

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 3px 0', letterSpacing: '-0.3px' }}>
                      {cohort.label}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={11} color="rgba(255,255,255,0.3)" />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{cohort.year}</span>
                    </div>
                  </div>
                  <div style={{
                    background: `${accent}18`, border: `1px solid ${accent}30`,
                    borderRadius: '10px', padding: '6px 12px', textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '18px', fontWeight: '700', color: accent, margin: 0, lineHeight: 1 }}>
                      {(cohort.total_imported || 0).toLocaleString()}
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0' }}>students</p>
                  </div>
                </div>

                {/* Status pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: cohort.total_imported > 0 ? '#10b981' : 'rgba(255,255,255,0.2)'
                  }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    {cohort.total_imported > 0 ? 'Data imported' : 'No data yet — import an Excel file'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openImport(cohort)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: '9px', padding: '9px', fontSize: '12px',
                      fontWeight: '500', color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                  >
                    <Upload size={13} />
                    {cohort.total_imported > 0 ? 'Re-import' : 'Import'}
                  </button>

                  {cohort.total_imported > 0 && (
                    <>
                      <button
                        onClick={() => router.push(`/dashboard/applicants/previous-years/${cohort.year}`)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          background: `${accent}18`, border: `1px solid ${accent}30`,
                          borderRadius: '9px', padding: '9px', fontSize: '12px',
                          fontWeight: '600', color: accent, cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = `${accent}28`}
                        onMouseLeave={e => e.currentTarget.style.background = `${accent}18`}
                      >
                        <Users size={13} /> Students
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/analytics/previous-years?year=${cohort.year}`)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                          borderRadius: '9px', padding: '9px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        title="View Analytics"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      >
                        <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Create New Year</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '7px' }}>
                  Label
                </label>
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="e.g. 2024 Intake"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                    padding: '10px 14px', fontSize: '13px', color: '#fff',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '7px' }}>
                  Year
                </label>
                <input
                  value={newYear}
                  onChange={e => setNewYear(e.target.value)}
                  placeholder="e.g. 2024"
                  type="number"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                    padding: '10px 14px', fontSize: '13px', color: '#fff',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '11px', fontSize: '13px',
                  fontWeight: '600', color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createCohort}
                disabled={!newLabel.trim() || !newYear.trim() || creating}
                style={{
                  flex: 1, background: creating || !newLabel.trim() || !newYear.trim()
                    ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.9)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  borderRadius: '10px', padding: '11px', fontSize: '13px',
                  fontWeight: '600', color: '#fff', cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {creating ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {importingId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 3px 0' }}>Import Excel</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  Year {importingYear} · existing data will be replaced
                </p>
              </div>
              <button onClick={closeImport} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Drop zone */}
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '10px', height: '140px', border: `2px dashed ${importFile ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
              background: importFile ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              marginBottom: '20px'
            }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => { setImportFile(e.target.files[0]); setImportResult(null) }}
              />
              <Upload size={22} color={importFile ? '#10b981' : 'rgba(255,255,255,0.25)'} />
              {importFile ? (
                <>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#10b981', margin: 0 }}>{importFile.name}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                    {(importFile.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Click to select Excel file
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>.xlsx or .xls only</p>
                </>
              )}
            </label>

            {/* Result */}
            {importResult && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px', marginBottom: '16px',
                background: importResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${importResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: importResult.success ? '#10b981' : '#f87171' }}>
                  {importResult.success
                    ? `✓ Successfully imported ${importResult.inserted.toLocaleString()} students`
                    : `✕ Error: ${importResult.error}`}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeImport}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '11px', fontSize: '13px',
                  fontWeight: '600', color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
                }}
              >
                {importResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!importResult?.success && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  style={{
                    flex: 1, background: !importFile || importing ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.85)',
                    border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '11px',
                    fontSize: '13px', fontWeight: '600', color: '#fff',
                    cursor: !importFile || importing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  {importing
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing...</>
                    : <><Upload size={14} /> Import</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(59,130,246,0.4) !important; }
      `}</style>
    </div>
  )
}