import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data: companions, error } = await supabase
    .from('companions')
    .select('*, companion_evaluations(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const evaluated = (companions || []).filter(c => c.companion_evaluations?.[0])
  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((s, c) => s + (c.companion_evaluations[0].total_score || 0), 0) / evaluated.length)
    : 0
  const veryReady = evaluated.filter(c => c.companion_evaluations[0].readiness === 'Very Ready').length
  const readySupport = evaluated.filter(c => c.companion_evaluations[0].readiness === 'Ready with Support').length
  const needsTraining = evaluated.filter(c => c.companion_evaluations[0].readiness === 'Needs Training').length

  const logoPath = path.join(process.cwd(), 'app', 'icon.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = logoBuffer.toString('base64')
  const logoDataUri = `data:image/png;base64,${logoBase64}`

  const html = buildHtml(companions ?? [], { avgScore, veryReady, readySupport, needsTraining }, logoDataUri)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline; filename="companions-report.html"',
    },
  })
}

function esc(str) {
  if (str === null || str === undefined) return '—'
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function readinessColor(r) {
  if (r === 'Very Ready') return '#10b981'
  if (r === 'Ready with Support') return '#f59e0b'
  if (r === 'Needs Training') return '#ef4444'
  return '#8888a8'
}

function buildHtml(companions, stats, logoSrc) {
  const rows = companions.map((c, i) => {
    const e = c.companion_evaluations?.[0]
    const score = e?.total_score ?? '—'
    const readiness = e?.readiness ?? '—'
    const rColor = readinessColor(readiness)

    return `<tr>
      <td style="text-align:center;font-weight:700;color:rgba(255,255,255,0.5);font-size:13px;">${i + 1}</td>
      <td style="font-weight:700;color:#ffffff;font-size:13px;min-width:130px;">${esc(c.name)}</td>
      <td style="font-weight:600;color:#e2e2f0;font-size:13px;">${esc(e?.department || '—')}</td>
      <td style="font-weight:600;color:#e2e2f0;font-size:13px;">${esc(e?.role_in_tours || '—')}</td>
      <td style="font-weight:600;color:#e2e2f0;font-size:12px;max-width:180px;white-space:normal;">${esc(e?.inside_jordan_experience || '—')}</td>
      <td style="font-weight:600;color:#e2e2f0;font-size:12px;max-width:180px;white-space:normal;">${esc(e?.outside_jordan_experience || '—')}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.commitment_to_booth ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.communication ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.counselor_engagement ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.htu_knowledge ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.data_capture ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.creativity ?? '—'}</td>
      <td style="text-align:center;font-weight:700;color:#60a5fa;font-size:13px;">${e?.english_language ?? '—'}</td>
      <td style="text-align:center;font-weight:800;color:#ffffff;background:rgba(59,130,246,0.15);font-size:14px;">${score}</td>
      <td style="text-align:center;">
        <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${rColor}20;color:${rColor};border:1px solid ${rColor}55;white-space:nowrap;">
          ${readiness}
        </span>
      </td>
      <td style="font-weight:600;color:#e2e2f0;font-size:12px;max-width:220px;white-space:normal;">${esc(e?.evaluation_notes || c.notes || '—')}</td>
    </tr>`
  }).join('')

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #ffffff; padding: 16mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 28px; }',
    '.header-logo { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px; }',
    '.header-sub { font-size: 13px; color: #8888a8; margin-top: 4px; }',
    '.report-title { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 18px; }',
    '.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }',
    '.stat-card { background: #14141e; border: 1px solid rgba(255,255,255,0.12); border-left: 4px solid #D63027; border-radius: 10px; padding: 18px 20px; }',
    '.stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8888a8; margin-bottom: 6px; letter-spacing: 0.5px; }',
    '.stat-value { font-size: 28px; font-weight: 800; color: #ffffff; }',
    '.section-title { font-size: 14px; font-weight: 700; color: #ffffff; border-left: 4px solid #D63027; padding-left: 12px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '.data-table { width: 100%; border-collapse: collapse; border: 1px solid rgba(255,255,255,0.12); }',
    '.data-table th { background: #14141e; color: #ffffff; padding: 14px 10px; text-align: center; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; border: 1px solid rgba(255,255,255,0.12); white-space: normal; line-height: 1.4; }',
    '.data-table td { padding: 14px 10px; border: 1px solid rgba(255,255,255,0.08); vertical-align: middle; line-height: 1.5; color: #ffffff; }',
    '.data-table tr:nth-child(even) td { background: rgba(255,255,255,0.03); }',
    '.data-table tbody tr:hover td { background: rgba(255,255,255,0.05); }',
    '.footer { margin-top: 48px; padding-top: 18px; border-top: 2px solid rgba(255,255,255,0.12); font-size: 11px; color: #8888a8; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 700; font-size: 12px; }',
  ].join(' ')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  ${css}
  @media print {
    .no-print { display: none !important; }
    @page { margin: 0; size: A4 landscape; }
  }
</style>
</head><body>
<div class="no-print" style="position:fixed;top:12px;right:12px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:10px 20px;background:#1a2d52;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⬇ Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#14141e;color:#eeeef5;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer;font-family:Inter,sans-serif;">✕ Close</button>
</div>
<div class="header">
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="padding-right:10px;"><img src="${logoSrc}" style="height:48px;width:auto;object-fit:contain;" alt="HTU Logo" /></div>
    <div>
      <div class="header-logo">Al-Hussein Technical University</div>
      <div class="header-sub">Students Recruitment &amp; Outreach Manager · <strong>Dalia Zawaideh</strong></div>
    </div>
  </div>
  <div style="font-size:12px;color:#8888a8;text-align:right;font-weight:600;">Companions Evaluation Report<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>

<div class="report-title">Companions Metrics Overview — ${companions.length} total</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">Average Score</div>
    <div class="stat-value" style="color:#3b82f6;">${stats.avgScore}<span style="font-size:14px;color:#8888a8;font-weight:600;"> / 35</span></div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Very Ready</div>
    <div class="stat-value" style="color:#10b981;">${stats.veryReady}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Ready with Support</div>
    <div class="stat-value" style="color:#f59e0b;">${stats.readySupport}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Needs Training</div>
    <div class="stat-value" style="color:#ef4444;">${stats.needsTraining}</div>
  </div>
</div>

<div class="section-title">Detailed Companion Evaluations</div>
<table class="data-table">
  <thead>
    <tr>
      <th style="width:36px;">#</th>
      <th style="text-align:left;min-width:120px;">Name</th>
      <th style="text-align:left;">Department</th>
      <th style="text-align:left;">Role in Tours</th>
      <th style="text-align:left;min-width:140px;">Inside Jordan Experience</th>
      <th style="text-align:left;min-width:140px;">Outside Jordan Experience</th>
      <th style="min-width:70px;">Commitment<br>to Booth</th>
      <th style="min-width:70px;">Communication</th>
      <th style="min-width:70px;">Counselor<br>Engagement</th>
      <th style="min-width:70px;">HTU<br>Knowledge</th>
      <th style="min-width:60px;">Data<br>Capture</th>
      <th style="min-width:60px;">Creativity</th>
      <th style="min-width:60px;">English<br>Language</th>
      <th style="min-width:50px;">Score</th>
      <th style="min-width:90px;">Readiness</th>
      <th style="text-align:left;min-width:160px;">Notes</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  <span class="footer-left">HTU · htu.edu.jo</span>
  <span style="font-weight:600;">Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>
  <span>King Hussein Business Park, Amman, Jordan</span>
</div>
</body></html>`
}