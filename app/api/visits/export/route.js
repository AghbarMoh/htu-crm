import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

function esc(str) {
  if (str === null || str === undefined) return '—'
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

function buildHtml(visits, completions, students, logoSrc, title) {
  const completionMap = {}
  for (const c of completions) completionMap[c.visit_id] = c

  const rows = visits.map((v, i) => {
    const done = completionMap[v.id]
    const isOutreach = ['Outreach fairs','Outreach School Tours','Outreach Events'].includes(v.type)
    const dateDisplay = isOutreach
      ? formatDate(v.outreach_start_date) + ' → ' + formatDate(v.outreach_end_date)
      : formatDate(v.visit_date)
    const timeDisplay = isOutreach
      ? (v.outreach_start_time || '—') + ' → ' + (v.outreach_end_time || '—')
      : (v.visit_time || '—')
    const studentCount = students.filter(s => s.visit_id === v.id).length

    return `<tr>
      <td style="color:rgba(255,255,255,0.3);text-align:center;">${i + 1}</td>
      <td style="color:#ffffff;"><strong>${esc(v.school_name)}</strong></td>
      <td>${esc(v.type)}</td>
      <td style="text-transform:capitalize;">${esc(v.private_or_public)}</td>
      <td>${esc(v.city || '—')}</td>
      <td style="white-space:nowrap;">${dateDisplay}</td>
      <td style="white-space:nowrap;">${timeDisplay}</td>
      <td>${esc(v.connection_status || 'New')}</td>
      <td>${esc(v.companion || '—')}</td>
      <td style="color:${done ? '#3ecf8e' : '#f06595'};font-weight:700;">${done ? '✓ Done' : 'Pending'}</td>
      <td style="text-align:center;font-weight:600;">${studentCount}</td>
      <td style="font-size:12px;color:#ffffff;font-weight:700;min-width:180px;">${esc(done?.comment || '—')}</td>
    </tr>`
  }).join('')

  const isArabic = str => /[\u0600-\u06FF]/.test(str)

  const photoSections = visits
    .filter(v => completionMap[v.id]?.images?.length > 0)
    .map(v => {
      const imgs = completionMap[v.id].images
      const imgTags = imgs.map(url =>
        `<img src="${url}" style="width:240px;height:180px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.15);" />`
      ).join('')
      const arabic = isArabic(v.school_name)
      return `<div style="margin-bottom:32px;">
        <div style="font-size:15px;font-weight:600;color:#ffffff;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15);direction:${arabic ? 'rtl' : 'ltr'};text-align:${arabic ? 'right' : 'left'};">${esc(v.school_name)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">${imgTags}</div>
      </div>`
    }).join('')

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    /* Force background color to fill browser viewport and paper */
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    /* Body padding handles the 'margin' visually while allowing background bleed */
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #ffffff; padding: 20mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 32px; }',
    '.header-logo { font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px; }',
    '.header-sub { font-size: 12px; font-weight: 600; color: #a0a0b0; margin-top: 4px; }',
    '.report-title { font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }',
    '.report-sub { font-size: 14px; font-weight: 600; color: #a0a0b0; margin-bottom: 32px; }',
    '.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }',
    '.summary-card { background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-left: 5px solid #D63027; border-radius: 8px; padding: 16px 20px; }',
    '.summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #a0a0b0; margin-bottom: 6px; }',
    '.summary-value { font-size: 28px; font-weight: 800; color: #ffffff; }',
    '.section-title { font-size: 16px; font-weight: 800; color: #ffffff; border-left: 4px solid #D63027; padding-left: 12px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '.data-table { width: 100%; border-collapse: collapse; font-size: 12px; font-weight: 600; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table th { background: #14141e; color: #ffffff; padding: 12px 10px; text-align: left; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table td { padding: 12px 10px; border: 1px solid rgba(255,255,255,0.15); vertical-align: top; line-height: 1.6; color: #ffffff; font-weight: 600; }',
    '.data-table tr:nth-child(even) td { background: rgba(255,255,255,0.03); }',
    '.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); font-size: 12px; font-weight: 600; color: #a0a0b0; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 800; font-size: 12px; }',
  ].join(' ')

  const total = visits.length
  const completed = visits.filter(v => completionMap[v.id]).length
  const pending = visits.filter(v => !completionMap[v.id]).length
  const totalStudents = students.filter(s => visits.some(v => v.id === s.visit_id)).length

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  ${css} 
  @media print { 
    .no-print { display: none !important; } 
    /* Force A4 Landscape with zero margin for full bleed */
    @page { margin: 0; size: A4 landscape; } 
  }
</style>
</head><body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:10px 20px;background:#1a2d52;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⬇ Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#14141e;color:#eeeef5;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer;font-family:Inter,sans-serif;">✕ Close</button>
</div>
<div class="header">
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="padding-right:12px;"><img src="${logoSrc}" style="height:48px;width:auto;object-fit:contain;" alt="HTU Logo" /></div>
    <div><div class="header-logo">Al-Hussein Technical University</div>
    <div class="header-sub">Students Recruitment &amp; Outreach Manager · <strong>Dalia Zawaideh</strong></div></div>
  </div>
  <div style="font-size:12px;color:#8888a8;text-align:right;">School Visits Report<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="report-title">${esc(title)}</div>
<div class="report-sub">Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
<div class="summary-grid">
  <div class="summary-card"><div class="summary-label">Total Visits</div><div class="summary-value">${total}</div></div>
  <div class="summary-card"><div class="summary-label">Completed</div><div class="summary-value" style="color:#3ecf8e;">${completed}</div></div>
  <div class="summary-card"><div class="summary-label">Pending</div><div class="summary-value" style="color:#f06595;">${pending}</div></div>
  <div class="summary-card"><div class="summary-label">Students Collected</div><div class="summary-value">${totalStudents}</div></div>
</div>
<div class="section-title">Visits List</div>
<table class="data-table">
  <thead><tr>
    <th style="width:40px;">#</th><th>School Name</th><th>Type</th><th>Sector</th><th>City</th>
    <th>Date</th><th>Time</th><th>Status</th><th>Companion</th><th>Done</th><th>Students</th><th>Notes</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
${photoSections ? `
<div style="margin-top:48px;margin-bottom:40px;">
  <div class="section-title">Photo Appendix</div>
  ${photoSections}
</div>` : ''}
<div class="footer">
  <span class="footer-left">HTU · htu.edu.jo</span>
  <span>Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>
  <span>King Hussein Business Park, Amman, Jordan</span>
</div>
</body></html>`
}

export async function GET(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all'
  const visitId = searchParams.get('visit_id')

  const [
    { data: allVisits },
    { data: completions },
    { data: students },
  ] = await Promise.all([
    supabase.from('school_visits').select('*').eq('is_cancelled', false).order('visit_date', { ascending: true }),
    supabase.from('visit_completions').select('*'),
    supabase.from('visit_students').select('*'),
  ])

  const completionMap = {}
  for (const c of (completions || [])) completionMap[c.visit_id] = c

  let visits = allVisits || []
  let title = 'All School Visits Report'

  // If a specific visit is requested, override everything else
  if (visitId) {
    visits = visits.filter(v => v.id === visitId)
    const schoolName = visits[0]?.school_name || 'School'
    title = `${schoolName} — Visit Report`
  } else {
    if (filter === 'pending') {
      visits = visits.filter(v => !completionMap[v.id])
      title = 'Pending Visits Report'
    } else if (filter === 'completed') {
      visits = visits.filter(v => completionMap[v.id])
      title = 'Completed Visits Report'
    }
  }

  const logoPath = path.join(process.cwd(), 'app', 'icon.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = logoBuffer.toString('base64')
  const logoDataUri = `data:image/png;base64,${logoBase64}`

  const html = buildHtml(visits, completions || [], students || [], logoDataUri, title)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="visits-${filter}-report.html"`,
    },
  })
}