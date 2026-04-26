import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

function esc(str) {
  if (str === null || str === undefined) return '—'
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtTime(t) {
  if (!t) return '—'
  return t
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildHtml(req, logoSrc) {
  const costFields = Array.isArray(req.cost_fields) ? req.cost_fields : []
  const total = costFields.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)

  const costRows = costFields.map(f =>
    '<tr><td>' + esc(f.label || '—') + '</td>' +
    '<td style="text-align:right;font-weight:600;color:#ffffff;">JD ' + parseFloat(f.amount || 0).toFixed(2) + '</td></tr>'
  ).join('')

  const totalRow =
    '<tr style="background:#14141e;">' +
    '<td style="color:#ffffff;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;border:1px solid rgba(255,255,255,0.15);">Total</td>' +
    '<td style="color:#ffffff;font-weight:700;font-size:16px;text-align:right;border:1px solid rgba(255,255,255,0.15);">JD ' + total.toFixed(2) + '</td>' +
    '</tr>'

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    /* Scaled body for A4 landscape */
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #eeeef5; padding: 20mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 32px; }',
    '.header-logo { font-size: 19px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px; }',
    '.header-sub { font-size: 12px; color: #8888a8; margin-top: 4px; }',
    '.report-title { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }',
    '.report-sub { font-size: 14px; color: #8888a8; margin-bottom: 32px; }',
    '.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-left: 5px solid #D63027; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px; }',
    '.meta-item { display: flex; flex-direction: column; gap: 4px; }',
    '.meta-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8888a8; }',
    '.meta-value { font-size: 14px; color: #ffffff; font-weight: 500; }',
    '.section { margin-bottom: 40px; }',
    '.section-title { font-size: 16px; font-weight: 700; color: #ffffff; border-left: 4px solid #D63027; padding-left: 12px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '.data-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table th { background: #14141e; color: #ffffff; padding: 12px; text-align: left; font-weight: 700; font-size: 12px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table td { padding: 12px; border: 1px solid rgba(255,255,255,0.15); vertical-align: top; line-height: 1.6; color: #cccccc; }',
    '.data-table tr:nth-child(even) td { background: rgba(255,255,255,0.03); }',
    '.notes-block { background: #14141e; border: 1px solid rgba(255,255,255,0.15); border-left: 5px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 16px 20px; font-size: 13px; color: #cccccc; line-height: 1.8; }',
    '.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); font-size: 11px; color: #8888a8; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 600; font-size: 12px; }',
  ].join(' ')

  const metaItems = [
    ['Visit Type',  req.visit_type],
    ['Companion',   req.companion],
    ['Date',        fmtDate(req.date)],
    ['Hours',       fmtTime(req.hour_from) + ' → ' + fmtTime(req.hour_to)],
    ['Prepared By', 'Dalia Zawaideh'],
    ['Generated',   new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
  ].map(([l, v]) =>
    '<div class="meta-item"><span class="meta-label">' + esc(l) + '</span><span class="meta-value">' + esc(v) + '</span></div>'
  ).join('')

  return `<!DOCTYPE html>
<html lang="en" dir="ltr"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  ${css} 
  @media print { 
    .no-print { display: none !important; } 
    @page { margin: 0; size: A4 landscape; } 
  }
</style>
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
  <div style="font-size:12px;color:#888;text-align:right;">Outreach Budget Request<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="report-title">${esc(req.visit_type)} — Budget Request</div>
<div class="report-sub">${fmtDate(req.date)}${req.companion ? ' &nbsp;·&nbsp; Companion: ' + esc(req.companion) : ''}</div>
<div class="meta-grid">${metaItems}</div>
<div class="section">
  <div class="section-title">Cost Breakdown</div>
  <table class="data-table">
    <thead><tr><th>Item</th><th style="text-align:right;">Amount (JD)</th></tr></thead>
    <tbody>${costRows || '<tr><td colspan="2" style="color:#999;text-align:center;">No cost items recorded</td></tr>'}</tbody>
    ${totalRow}
  </table>
</div>
${req.notes ? `<div class="section"><div class="section-title">Notes</div><div class="notes-block">${esc(req.notes)}</div></div>` : ''}
<div class="footer">
  <span class="footer-left">HTU · htu.edu.jo</span>
  <span>Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>
  <span>King Hussein Business Park, Amman, Jordan</span>
</div>
</body></html>`
}

export async function GET(req) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    let budgetReq

    if (id) {
      const { data, error } = await supabase.from('budget_requests').select('*').eq('id', id).single()
      if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      budgetReq = data
    } else {
      const costFields = searchParams.get('cost_fields')
      budgetReq = {
        visit_type:  searchParams.get('visit_type') ?? '',
        companion:   searchParams.get('companion') ?? '',
        date:        searchParams.get('date') ?? '',
        hour_from:   searchParams.get('hour_from') ?? '',
        hour_to:     searchParams.get('hour_to') ?? '',
        cost_fields: costFields ? JSON.parse(decodeURIComponent(costFields)) : [],
        total:       searchParams.get('total') ?? '0',
        notes:       searchParams.get('notes') ?? '',
      }
    }

    const logoPath = path.join(process.cwd(), 'app', 'icon.png')
    const logoBuffer = fs.readFileSync(logoPath)
    const logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`

    const html = buildHtml(budgetReq, logoDataUri)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="budget-request-${budgetReq.date || 'report'}.html"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}