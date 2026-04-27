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
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

function renderSection(title, content) {
  if (!content || (typeof content === 'string' && !content.trim())) return ''
  return `<div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;color:#ffffff;border-left:4px solid #D63027;padding-left:12px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.3px;">${title}</div>
    <div dir="auto" style="font-size:13px;font-weight:600;color:#ffffff;line-height:1.7;white-space:pre-wrap;">${esc(content)}</div>
  </div>`
}

function renderSchoolsTable(schools) {
  if (!schools || !Array.isArray(schools) || schools.length === 0) return ''
  
  const rows = schools.map(s => `
    <tr>
      <td dir="auto" style="padding:10px; border:1px solid rgba(255,255,255,0.15); color:#ffffff; font-weight:600;">${esc(s.schoolName)}</td>
      <td dir="auto" style="padding:10px; border:1px solid rgba(255,255,255,0.15); color:#ffffff; font-weight:600;">${esc(s.counselor)}</td>
      <td dir="auto" style="padding:10px; border:1px solid rgba(255,255,255,0.15); color:#ffffff; font-weight:600;">${esc(s.email)}</td>
    </tr>
  `).join('')

  return `<div style="margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;color:#ffffff;border-left:4px solid #D63027;padding-left:12px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.3px;">Schools / Institutions Visited</div>
    <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
      <thead>
        <tr>
          <th style="padding:10px; background:#14141e; color:#ffffff; border:1px solid rgba(255,255,255,0.15); text-transform:uppercase;">School Name</th>
          <th style="padding:10px; background:#14141e; color:#ffffff; border:1px solid rgba(255,255,255,0.15); text-transform:uppercase;">Counselor</th>
          <th style="padding:10px; background:#14141e; color:#ffffff; border:1px solid rgba(255,255,255,0.15); text-transform:uppercase;">Email</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function renderPhotoSection(images) {
  if (!images || images.length === 0) return ''
  return `<div style="margin-bottom:20px;">
    <div style="font-size:12px;font-weight:700;color:#ffffff;border-left:4px solid #D63027;padding-left:10px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.3px;">Photo Documentation</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">${images.map(url =>
      `<img src="${url}" style="width:200px;height:150px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,0.15);" />`
    ).join('')}</div>
  </div>`
}

function buildHtml(visit, completion, sections, logoSrc) {
  const css = [
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #ffffff; padding: 20mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    ".header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 32px; }",
    ".header-logo { font-size: 19px; font-weight: 800; color: #ffffff; }",
    ".header-sub { font-size: 12px; font-weight: 600; color: #a0a0b0; margin-top: 4px; }",
    ".report-title { font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }",
    ".report-sub { font-size: 14px; font-weight: 600; color: #a0a0b0; margin-bottom: 32px; }",
    ".meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-left: 5px solid #D63027; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px; }",
    ".meta-item { display: flex; flex-direction: column; gap: 4px; }",
    ".meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #a0a0b0; }",
    ".meta-value { font-size: 14px; font-weight: 600; color: #ffffff; }",
    ".footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); font-size: 12px; font-weight: 600; color: #a0a0b0; display: flex; align-items: center; justify-content: space-between; }",
    ".footer-left { color: #D63027; font-weight: 800; font-size: 12px; }",
  ].join(' ')

  const meta = [
    ['Visit Name', visit.name || '—'],
    ['Type', visit.type || '—'],
    ['City', visit.city || '—'],
    ['Country', visit.country || '—'],
    ['Date Range', `${formatDate(visit.date_from)} → ${formatDate(visit.date_to)}`],
    ['Time Range', `${visit.time_from || '—'} → ${visit.time_to || '—'}`],
    ['Companion', visit.companion || '—'],
    ['Status', completion ? 'Completed' : 'Pending'],
    ['Completed On', completion ? new Date(completion.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
  ].map(([l, v]) =>
    `<div class="meta-item"><span class="meta-label">${l}</span><span class="meta-value" dir="auto">${esc(v)}</span></div>`
  ).join('')

  const rd = completion?.report_data || {}

  // Notice how we use renderSchoolsTable specifically for rd.schools
  const body = [
    renderSection('Purpose & Objectives', rd.purpose),
    renderSchoolsTable(rd.schools), 
    renderSection('Summary of Activities', rd.activities),
    renderSection('Student Engagement & Leads', rd.leads),
    renderSection('Market Insights & Observations', rd.insights),
    renderSection('Strengths', rd.strengths),
    renderSection('Weaknesses / Challenges', rd.weaknesses),
    renderSection('Recommendations & Next Steps', rd.recommendations),
    renderSection('Additional Notes', completion?.comment),
    renderPhotoSection(completion?.images),
  ].join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css} @media print { .no-print { display: none !important; } @page { margin: 0; size: A4 portrait; } }</style>
</head><body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:10px 20px;background:#1a2d52;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⬇ Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#14141e;color:#eeeef5;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer;">✕ Close</button>
</div>
<div class="header">
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="padding-right:12px;"><img src="${logoSrc}" style="height:48px;width:auto;object-fit:contain;" alt="HTU Logo" /></div>
    <div><div class="header-logo">Al-Hussein Technical University</div>
    <div class="header-sub">Students Recruitment &amp; Outreach Manager · <strong>Dalia Zawaideh</strong></div></div>
  </div>
  <div style="font-size:12px;color:#888;text-align:right;">Outreach Visit Report<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="report-title">Outreach Visit Report</div>
<div class="report-sub">Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
<div class="meta-grid">${meta}</div>
 ${body}
<div class="footer">
  <span class="footer-left">HTU · htu.edu.jo</span>
  <span>Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>
  <span>King Hussein Business Park, Amman, Jordan</span>
</div>
</body></html>`
}

export async function GET(req) {
    const authCheck = await requireAuth()
  if (authCheck.errorResponse) return authCheck.errorResponse

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing visit id' }, { status: 400 })

  const [{ data: visit, error: ve }, { data: completion, error: ce }] = await Promise.all([
    supabase.from('outreach_visits').select('*').eq('id', id).single(),
    supabase.from('outreach_completions').select('*').eq('visit_id', id).single(),
  ])

  if (ve || !visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  const logoPath = path.join(process.cwd(), 'app', 'icon.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = logoBuffer.toString('base64')
  const logoDataUri = `data:image/png;base64,${logoBase64}`

  const html = buildHtml(visit, completion, undefined, logoDataUri)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="outreach-report-${id}.html"`,
    },
  })
}