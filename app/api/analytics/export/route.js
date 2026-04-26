import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const [
    { data: visits },
    { data: completions },
    { data: students },
    { data: allApplicants },
    { data: contacts },
    { data: completedApplicants },
  ] = await Promise.all([
    supabase.from('school_visits').select('*'),
    supabase.from('visit_completions').select('*'),
    supabase.from('visit_students').select('*'),
supabase.from('applicants').select('*'),
    supabase.from('contacts').select('*'),
    supabase.from('completed_applicants').select('school_name, major'),
  ])

  // FILTER: Only completed/archived applicants (exclude status 'red' or 'green')
  const applicants = allApplicants || []
  const completedVisits = (visits || []).filter(v => 
    (completions || []).some(c => c.visit_id === v.id)
  )

  const stats = {
    totalApplicants: applicants.length,
    totalVisits: completedVisits.length,
    totalLeads: (students || []).length,
    totalContacts: (contacts || []).length
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

  // Major Breakdown (from completed_applicants)
  const majorCounts = {}
  ;(completedApplicants || []).forEach(a => { if (a.major) majorCounts[a.major] = (majorCounts[a.major] || 0) + 1 })
  const totalMajorCount = Object.values(majorCounts).reduce((s, c) => s + c, 0)
  const majorRows = Object.entries(majorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([m, c], index) => {
      const pct = totalMajorCount ? Math.round((c / totalMajorCount) * 100) : 0
      const color = COLORS[index % COLORS.length]
      return `<div class="chart-row">
        <div class="chart-label">${esc(m)} <span style="color:#8888a8;font-size:11px;">(${c} applicants)</span></div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%;background:${color};"></div></div>
        <div class="chart-pct" style="color:${color};">${pct}%</div>
      </div>`
    }).join('')

  // Visit Type Breakdown
  const typeCounts = {}
  completedVisits.forEach(v => { if (v.type) typeCounts[v.type] = (typeCounts[v.type] || 0) + 1 })
  const typeRows = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c], index) => {
      const pct = stats.totalVisits ? Math.round((c / stats.totalVisits) * 100) : 0
      const color = COLORS[index % COLORS.length]
      return `<div class="chart-row">
        <div class="chart-label">${esc(t)} <span style="color:#8888a8;font-size:11px;">(${c} visits)</span></div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%;background:${color};"></div></div>
        <div class="chart-pct" style="color:${color};">${pct}%</div>
      </div>`
    }).join('')

  // Top Performing Schools
  const schoolCounts = {}
  ;(completedApplicants || []).forEach(a => { if (a.school_name) schoolCounts[a.school_name] = (schoolCounts[a.school_name] || 0) + 1 })
  const totalEnrolled = Object.values(schoolCounts).reduce((s, c) => s + c, 0)
  const schoolRows = Object.entries(schoolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, c], index) => {
      const pct = totalEnrolled ? Math.round((c / totalEnrolled) * 100) : 0
      const medalColor = index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7c3a' : '#3b82f6'
      return `<div class="chart-row">
        <div class="chart-label" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;font-weight:700;color:${medalColor};min-width:22px;">#${index + 1}</span>
          ${esc(name)} <span style="color:#8888a8;font-size:11px;">(${c} enrolled)</span>
        </div>
        <div class="chart-track"><div class="chart-fill" style="width:${pct}%;background:${medalColor};"></div></div>
        <div class="chart-pct" style="color:${medalColor};">${pct}%</div>
      </div>`
    }).join('')

  // Repeat vs New
  const newVisits = completedVisits.filter(v => v.connection_status === 'New').length
  const repeatedVisits = completedVisits.filter(v => v.connection_status === 'Repeated').length
  const otherVisits = stats.totalVisits - newVisits - repeatedVisits
  const engagementRows = [
    { label: 'New Schools', count: newVisits, color: '#60a5fa', desc: 'First-time outreach visits' },
    { label: 'Repeated Schools', count: repeatedVisits, color: '#34d399', desc: 'Returning relationship visits' },
    ...(otherVisits > 0 ? [{ label: 'Untagged', count: otherVisits, color: 'rgba(255,255,255,0.3)', desc: 'No status recorded' }] : [])
  ].map(item => {
    const pct = stats.totalVisits ? Math.round((item.count / stats.totalVisits) * 100) : 0
    return `<div class="chart-row">
      <div class="chart-label">${esc(item.label)} <span style="color:#8888a8;font-size:11px;">(${item.count} visits · ${esc(item.desc)})</span></div>
      <div class="chart-track"><div class="chart-fill" style="width:${pct}%;background:${item.color};"></div></div>
      <div class="chart-pct" style="color:${item.color};">${pct}%</div>
    </div>`
  }).join('')

  const logoPath = path.join(process.cwd(), 'app', 'icon.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`

  const html = buildHtml(stats, majorRows, typeRows, schoolRows, engagementRows, logoDataUri)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline; filename="analytics-report.html"',
    },
  })
}

function esc(str) {
  if (str === null || str === undefined) return '—'
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHtml(stats, majorRows, typeRows, schoolRows, engagementRows, logoSrc) {
  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #eeeef5; padding: 20mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 32px; }',
    '.header-logo { font-size: 19px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px; }',
    '.report-title { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 24px; }',
    '.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }',
    '.summary-card { background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-left: 5px solid #D63027; border-radius: 8px; padding: 16px 20px; }',
    '.summary-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8888a8; margin-bottom: 6px; }',
    '.summary-value { font-size: 28px; font-weight: 700; color: #ffffff; }',
    '.section-title { font-size: 16px; font-weight: 700; color: #ffffff; border-left: 4px solid #D63027; padding-left: 12px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '.chart-container { background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; margin-bottom: 32px; }',
    '.chart-row { display: flex; align-items: center; margin-bottom: 14px; }',
    '.chart-label { width: 40%; font-size: 12px; color: #cccccc; padding-right: 12px; }',
    '.chart-track { flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; }',
    '.chart-fill { height: 100%; border-radius: 5px; }',
    '.chart-pct { width: 45px; text-align: right; font-size: 12px; font-weight: 700; color: #ffffff; padding-left: 10px; }',
    '.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); font-size: 11px; color: #8888a8; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 600; font-size: 12px; }',
  ].join(' ')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css} @media print { .no-print { display: none !important; } @page { margin: 0; size: A4 landscape; } }</style>
</head><body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:10px 20px;background:#1a2d52;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">⬇ Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#14141e;color:#eeeef5;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer;">✕ Close</button>
</div>
<div class="header">
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="padding-right:12px;"><img src="${logoSrc}" style="height:48px;width:auto;object-fit:contain;" alt="HTU Logo" /></div>
    <div><div class="header-logo">Al-Hussein Technical University</div>
    <div class="header-sub">Students Recruitment &amp; Outreach Manager · <strong>Dalia Zawaideh</strong></div></div>
  </div>
  <div style="font-size:12px;color:#8888a8;text-align:right;">Analytics Report<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="report-title">HTU Outreach Performance Analytics</div>
<div class="summary-grid">
  <div class="summary-card"><div class="summary-label">Total Applicants</div><div class="summary-value" style="color:#3b82f6;">${stats.totalApplicants}</div></div>
  <div class="summary-card"><div class="summary-label">Completed Visits</div><div class="summary-value" style="color:#f59e0b;">${stats.totalVisits}</div></div>
  <div class="summary-card"><div class="summary-label">Leads Collected</div><div class="summary-value" style="color:#f97316;">${stats.totalLeads}</div></div>
  <div class="summary-card"><div class="summary-label">Total Contacts</div><div class="summary-value" style="color:#ec4899;">${stats.totalContacts}</div></div>
</div>
<div class="section-title">Applicants by Major</div>
<div class="chart-container">${majorRows || '<div style="color:#8888a8;text-align:center;">No data</div>'}</div>
<div class="section-title">Visits by Type</div>
<div class="chart-container">${typeRows || '<div style="color:#8888a8;text-align:center;">No data</div>'}</div>
<div class="section-title">Top Performing Schools</div>
<div class="chart-container">${schoolRows || '<div style="color:#8888a8;text-align:center;">No data</div>'}</div>
<div class="section-title">Repeat vs New School Engagement</div>
<div class="chart-container">${engagementRows || '<div style="color:#8888a8;text-align:center;">No data</div>'}</div>
<div class="footer"><span class="footer-left">HTU · htu.edu.jo</span><span>King Hussein Business Park, Amman, Jordan</span></div>
</body></html>`
}