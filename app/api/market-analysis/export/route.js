// app/api/market-analysis/export/route.js

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

// Arabic is now ALLOWED — no stripping

export async function GET(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const [
    { data: report, error: re },
    { data: sectionsRaw, error: se },
    { data: cities, error: ce },
  ] = await Promise.all([
    supabase.from('market_reports').select('*').eq('id', id).single(),
    supabase.from('report_sections').select('*').eq('report_id', id),
    supabase.from('report_cities').select('*').eq('report_id', id).order('created_at', { ascending: true }),
  ])

  if (re || !report) return NextResponse.json({ error: re?.message ?? 'Report not found' }, { status: 404 })
  if (se) return NextResponse.json({ error: se.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  const sections = {}
  for (const row of (sectionsRaw ?? [])) {
    sections[row.section_type] = row.content
  }

  // Read the logo from your public folder and convert to Base64
  const logoPath = path.join(process.cwd(), 'app', 'icon.png');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const html = buildHtml(report, sections, cities ?? [], logoDataUri)

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="market-report-${id}.html"`,
    },
  })
}

// Render SWOT items — supports both array (new) and string (legacy)
function renderSwotQuadrant(val) {
  if (!val) return '—'
  if (Array.isArray(val)) {
    if (val.length === 0) return '—'
    return val.map((item, i) => `<div style="display:flex;gap:6px;margin-bottom:5px;"><span style="flex-shrink:0;">${i+1}.</span><span>${item}</span></div>`).join('')
  }
  if (typeof val === 'string') {
    const lines = val.split('\n').filter(Boolean)
    if (lines.length === 0) return '—'
    return lines.map((line, i) => `<div style="display:flex;gap:6px;margin-bottom:5px;"><span style="flex-shrink:0;">${i+1}.</span><span>${line}</span></div>`).join('')
  }
  return '—'
}

function esc(str) {
  if (str === null || str === undefined) return '—'
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildHtml(report, s, cities, logoSrc) {
  const meta = [
    ['Institution',      'Al-Hussein Technical University — HTU'],
    ['Market / Country', report.country],
    ['Education Level',  report.education_level ?? '—'],
    ['Study Period',     (report.study_period_from ?? '—') + ' – ' + (report.study_period_to ?? '—')],
    ['Prepared By',      report.prepared_by ?? '—'],
    ['Data Sources',     report.data_sources ?? '—'],
    ['Last Updated',     new Date(report.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Status',           report.status],
  ].map(([l, v]) =>
    '<div class="meta-item"><span class="meta-label">' + esc(l) + '</span><span class="meta-value">' + esc(v) + '</span></div>'
  ).join('')

  // Market overview
  const overview = s.market_overview ? (
    '<div class="section"><div class="section-title">Market Overview</div><table class="data-table">' +
    '<tr><th>Metric</th><th>Value</th></tr>' +
    '<tr><td>Total target graduates / year</td><td>'            + esc(s.market_overview.total_graduates)  + '</td></tr>' +
    '<tr><td>Estimated interested in studying abroad</td><td>'  + esc(s.market_overview.interested_abroad) + '</td></tr>' +
    '<tr><td>Estimated interested in STEM</td><td>'             + esc(s.market_overview.interested_stem)  + '</td></tr>' +
    '<tr><td>Key macro trends</td><td style="white-space:pre-line;">'  + esc(s.market_overview.key_trends)       + '</td></tr>' +
    '<tr><td>Notes</td><td style="white-space:pre-line;">'              + esc(s.market_overview.notes)            + '</td></tr>' +
    '</table></div>'
  ) : ''

  // Decision factors
  const decisionRows = (s.decision_factors?.rows ?? []).map(r =>
    '<tr><td>' + esc(r.factor) + '</td><td style="text-align:center;">' +
    esc(r.importance) + '</td><td style="white-space:pre-line;">' + esc(r.notes) + '</td></tr>'
  ).join('')
  const decision = decisionRows ? (
    '<div class="section"><div class="section-title">Decision Factors</div><table class="data-table">' +
    '<tr><th>Factor</th><th>Importance (1-5)</th><th>Notes / Evidence</th></tr>' +
    decisionRows + '</table></div>'
  ) : ''

  // Constraints
  const constraintRows = (s.constraints?.rows ?? []).map(r =>
    '<tr><td>' + esc(r.category) + '</td><td style="white-space:pre-line;">' + esc(r.details) + '</td>' +
    '<td style="text-align:center;font-weight:600;color:' +
      (r.risk_level === 'H' ? '#c0392b' : r.risk_level === 'M' ? '#e67e22' : '#27ae60') + '">' +
    esc(r.risk_level) + '</td><td style="white-space:pre-line;">' + esc(r.mitigation) + '</td></tr>'
  ).join('')
  const constraints = constraintRows ? (
    '<div class="section"><div class="section-title">Constraints</div><table class="data-table">' +
    '<tr><th>Category</th><th>Details</th><th>Risk</th><th>Mitigation</th></tr>' +
    constraintRows + '</table></div>'
  ) : ''

  // SWOT — supports arrays (new) and strings (legacy)
  const swot = s.swot ? (
    '<div class="section"><div class="section-title">SWOT Analysis</div><table class="swot-table"><tr>' +
    '<td class="swot-s"><div class="swot-head">Strengths</div><div class="swot-body">'     + renderSwotQuadrant(s.swot.strengths)     + '</div></td>' +
    '<td class="swot-w"><div class="swot-head">Weaknesses</div><div class="swot-body">'    + renderSwotQuadrant(s.swot.weaknesses)    + '</div></td>' +
    '</tr><tr>' +
    '<td class="swot-o"><div class="swot-head">Opportunities</div><div class="swot-body">' + renderSwotQuadrant(s.swot.opportunities) + '</div></td>' +
    '<td class="swot-t"><div class="swot-head">Threats</div><div class="swot-body">'       + renderSwotQuadrant(s.swot.threats)       + '</div></td>' +
    '</tr></table></div>'
  ) : ''

  // Action plan
  const actionRows = (s.action_plan?.rows ?? []).map(r =>
    '<tr><td>' + esc(r.initiative) + '</td><td>' + esc(r.description) + '</td><td>' +
    esc(r.owner) + '</td><td>' + esc(r.start_date) + '</td><td>' +
    esc(r.end_date) + '</td><td>' + esc(r.status) + '</td></tr>'
  ).join('')
  const actionPlan = actionRows ? (
    '<div class="section"><div class="section-title">Action Plan</div><table class="data-table">' +
    '<tr><th>Initiative</th><th>Description</th><th>Owner</th><th>Start</th><th>End</th><th>Status</th></tr>' +
    actionRows + '</table></div>'
  ) : ''

  // KPI Tracker — new column structure
  const kpiRows = (s.kpi_tracker?.rows ?? []).map(r =>
    '<tr>' +
    '<td><strong>' + esc(r.kpi) + '</strong></td>' +
    '<td style="text-align:center;">' + esc(r.baseline_year ?? r.baseline) + '</td>' +
    '<td style="text-align:center;">' + esc(r.baseline_value ?? '—') + '</td>' +
    '<td style="text-align:center;">' + esc(r.target_year ?? '—') + '</td>' +
    '<td style="text-align:center;">' + esc(r.target_value ?? r.target) + '</td>' +
    '<td style="text-align:center;">' + esc(r.current_value ?? r.current) + '</td>' +
    '<td>' + esc(r.frequency || r.source) + '</td>' +
    '</tr>'
  ).join('')

  const kpiTracker = kpiRows ? (
    '<div class="section"><div class="section-title">KPI Tracker</div><table class="data-table">' +
    '<tr><th>KPI</th><th>Baseline Year</th><th>Baseline Value</th><th>Target Year</th><th>Target Value</th><th>Current Value</th><th>Freq / Source</th></tr>' +
    kpiRows + '</table></div>'
  ) : ''

  // Update Log
  const updateLogRows = (s.kpi_tracker?.update_log ?? []).map(entry =>
    '<tr>' +
    '<td>' + esc(entry.date) + '</td>' +
    '<td>' + esc(entry.what_updated) + '</td>' +
    '<td>' + esc(entry.data_source) + '</td>' +
    '<td>' + esc(entry.updated_by) + '</td>' +
    '<td>' + esc(entry.notes) + '</td>' +
    '</tr>'
  ).join('')

  const updateLog = updateLogRows ? (
    '<div class="section"><div class="section-title">KPI Update Log</div><table class="data-table">' +
    '<tr><th>Date</th><th>What Updated</th><th>Data Source</th><th>Updated By</th><th>Notes</th></tr>' +
    updateLogRows + '</table></div>'
  ) : ''

  // City blocks — now with full sections like country
  const cityBlocks = cities.map(c => {
    const cs = c.content?.sections ?? {}
    const cityOverview = cs.market_overview ? (
      '<div class="sub-section"><div class="sub-section-title">Market Overview</div><table class="data-table">' +
      '<tr><th>Metric</th><th>Value</th></tr>' +
      '<tr><td>Total target graduates / year</td><td>'           + esc(cs.market_overview.total_graduates)  + '</td></tr>' +
      '<tr><td>Estimated interested in studying abroad</td><td>' + esc(cs.market_overview.interested_abroad) + '</td></tr>' +
      '<tr><td>Estimated interested in STEM</td><td>'            + esc(cs.market_overview.interested_stem)  + '</td></tr>' +
      '<tr><td>Key macro trends</td><td style="white-space:pre-line;">' + esc(cs.market_overview.key_trends) + '</td></tr>' +
      '<tr><td>Notes</td><td style="white-space:pre-line;">'     + esc(cs.market_overview.notes)            + '</td></tr>' +
      '</table></div>'
    ) : ''

    const cityDecisionRows = (cs.decision_factors?.rows ?? []).map(r =>
      '<tr><td>' + esc(r.factor) + '</td><td style="text-align:center;">' + esc(r.importance) + '</td><td>' + esc(r.notes) + '</td></tr>'
    ).join('')
    const cityDecision = cityDecisionRows ? (
      '<div class="sub-section"><div class="sub-section-title">Decision Factors</div><table class="data-table">' +
      '<tr><th>Factor</th><th>Importance</th><th>Notes</th></tr>' + cityDecisionRows + '</table></div>'
    ) : ''

    const cityConstraintRows = (cs.constraints?.rows ?? []).map(r =>
      '<tr><td>' + esc(r.category) + '</td><td>' + esc(r.details) + '</td>' +
      '<td style="text-align:center;font-weight:600;color:' + (r.risk_level === 'H' ? '#c0392b' : r.risk_level === 'M' ? '#e67e22' : '#27ae60') + '">' +
      esc(r.risk_level) + '</td><td>' + esc(r.mitigation) + '</td></tr>'
    ).join('')
    const cityConstraints = cityConstraintRows ? (
      '<div class="sub-section"><div class="sub-section-title">Constraints</div><table class="data-table">' +
      '<tr><th>Category</th><th>Details</th><th>Risk</th><th>Mitigation</th></tr>' + cityConstraintRows + '</table></div>'
    ) : ''

    const citySwot = cs.swot ? (
      '<div class="sub-section"><div class="sub-section-title">SWOT</div><table class="swot-table"><tr>' +
      '<td class="swot-s"><div class="swot-head">Strengths</div><div class="swot-body">'     + renderSwotQuadrant(cs.swot.strengths)     + '</div></td>' +
      '<td class="swot-w"><div class="swot-head">Weaknesses</div><div class="swot-body">'    + renderSwotQuadrant(cs.swot.weaknesses)    + '</div></td>' +
      '</tr><tr>' +
      '<td class="swot-o"><div class="swot-head">Opportunities</div><div class="swot-body">' + renderSwotQuadrant(cs.swot.opportunities) + '</div></td>' +
      '<td class="swot-t"><div class="swot-head">Threats</div><div class="swot-body">'       + renderSwotQuadrant(cs.swot.threats)       + '</div></td>' +
      '</tr></table></div>'
    ) : ''

    const cityKpiRows = (cs.kpi_tracker?.rows ?? []).map(r =>
      '<tr><td><strong>' + esc(r.kpi) + '</strong></td>' +
      '<td>' + esc(r.baseline_year ?? r.baseline) + '</td>' +
      '<td>' + esc(r.baseline_value ?? '—') + '</td>' +
      '<td>' + esc(r.target_year ?? '—') + '</td>' +
      '<td>' + esc(r.target_value ?? r.target) + '</td>' +
      '<td>' + esc(r.current_value ?? r.current) + '</td>' +
      '<td>' + esc(r.frequency || r.source) + '</td></tr>'
    ).join('')
    const cityKpi = cityKpiRows ? (
      '<div class="sub-section"><div class="sub-section-title">KPI Tracker</div><table class="data-table">' +
      '<tr><th>KPI</th><th>Baseline Yr</th><th>Baseline Val</th><th>Target Yr</th><th>Target Val</th><th>Current</th><th>Freq/Source</th></tr>' +
      cityKpiRows + '</table></div>'
    ) : ''

    return (
      '<div class="section page-break"><div class="section-title">City: ' + esc(c.city_name) + '</div>' +
      (c.content?.notes ? '<p style="font-size:13px;color:#444;line-height:1.7;margin-bottom:16px;">' + esc(c.content.notes) + '</p>' : '') +
      cityOverview + cityDecision + cityConstraints + citySwot + cityKpi +
      '</div>'
    )
  }).join('')

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px 40px; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 18px 0; border-bottom: 3px solid #D63027; margin-bottom: 28px; }',
    '.header-logo { font-size: 17px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.2px; }',
    '.header-sub { font-size: 11px; color: #666; margin-top: 3px; }',
    '.report-title { font-size: 22px; font-weight: 700; color: #0a0a0a; margin-bottom: 6px; }',
    '.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; background: #f9f9f9; border: 1px solid #e8e8e8; border-left: 4px solid #D63027; border-radius: 6px; padding: 16px 20px; margin-bottom: 28px; }',
    '.meta-item { display: flex; flex-direction: column; gap: 2px; }',
    '.meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #999; }',
    '.meta-value { font-size: 13px; color: #1a1a1a; unicode-bidi: plaintext; }',
    '.prepared-by-block { background: #0a0a0a; color: #fff; border-radius: 6px; padding: 14px 18px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; }',
    '.prepared-by-block .name { font-size: 14px; font-weight: 600; color: #fff; }',
    '.prepared-by-block .role { font-size: 11px; color: #aaa; margin-top: 2px; }',
    '.prepared-by-block .org { font-size: 11px; color: #D63027; font-weight: 500; }',
    '.section { margin-bottom: 32px; }',
    '.section-title { font-size: 14px; font-weight: 700; color: #0a0a0a; border-left: 4px solid #D63027; padding-left: 10px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.3px; }',
    '.sub-section { margin-bottom: 20px; padding-left: 12px; border-left: 2px solid #e8e8e8; }',
    '.sub-section-title { font-size: 11px; font-weight: 700; color: #D63027; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.4px; }',
    '.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }',
    '.data-table th { background: #0a0a0a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }',
    '.data-table td { padding: 8px 10px; border-bottom: 1px solid #efefef; vertical-align: top; line-height: 1.6; unicode-bidi: plaintext; direction: ltr; }',
    '.data-table td[lang="ar"], .data-table td.rtl { direction: rtl; text-align: right; }',
    '.data-table tr:last-child td { border-bottom: none; }',
    '.data-table tr:nth-child(even) td { background: #fafafa; }',
    '.swot-table { width: 100%; border-collapse: collapse; }',
    '.swot-table td { width: 50%; padding: 14px 16px; vertical-align: top; border: 1px solid #e8e8e8; }',
    '.swot-s { background: #f6fef9; } .swot-w { background: #fff5f5; }',
    '.swot-o { background: #f5f5f5; } .swot-t { background: #fffbf0; }',
    '.swot-head { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid currentColor; }',
    '.swot-s .swot-head { color: #1a7a4a; } .swot-w .swot-head { color: #D63027; }',
    '.swot-o .swot-head { color: #444; } .swot-t .swot-head { color: #b07d10; }',
    '.swot-body { font-size: 12px; color: #333; line-height: 1.7; unicode-bidi: plaintext; }',
    '.page-break { page-break-before: always; }',
    '.footer { margin-top: 48px; padding-top: 14px; border-top: 2px solid #0a0a0a; font-size: 10px; color: #888; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 600; font-size: 11px; }',
  ].join(' ')

  return '<!DOCTYPE html>' +
    '<html lang="en" dir="ltr"><head><meta charset="UTF-8">' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<style>' + css + '@media print { .no-print { display: none !important; } @page { margin: 20mm; } }</style>' +
    '</head><body>' +
    '<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">' +
    '<button onclick="window.print()" style="padding:8px 16px;background:#1a2d52;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif;">⬇ Save as PDF</button>' +
    '<button onclick="window.close()" style="padding:8px 16px;background:#f7f8fc;color:#1a1a2e;border:1px solid #e0e4f0;border-radius:7px;font-size:13px;cursor:pointer;font-family:Inter,sans-serif;">✕ Close</button>' +
    '</div>' +
    '<div class="header">' +
    '<div style="display:flex;align-items:center;gap:14px;">' +
    '<div style="display:flex;align-items:center;justify-content:center; padding-right: 10px;">' +
    '<img src="' + logoSrc + '" style="height:40px; width:auto; object-fit:contain; mix-blend-mode: multiply;" alt="HTU Logo" />' +
    '</div>' +
    '<div><div class="header-logo">Al-Hussein Technical University</div>' +
    '<div class="header-sub">Students Recruitment &amp; Outreach Manager · <strong>Dalia Zawaideh</strong></div></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#888;text-align:right;">Market Analysis Report<br>Generated ' +
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div>' +
    '<div class="report-title">' + esc(report.country) + ' — Market Study ' + (report.study_period_from ?? '') + '</div>' +
    '' +
    '<div class="meta-grid">' + meta + '</div>' +
    '' +
    overview + decision + constraints + swot + actionPlan + kpiTracker + updateLog + cityBlocks +
    '<div class="footer">' +
    '<span class="footer-left">HTU · htu.edu.jo</span>' +
    '<span>Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>' +
    '<span>King Hussein Business Park, Amman, Jordan</span>' +
    '</div>' +
    '</body></html>'
}