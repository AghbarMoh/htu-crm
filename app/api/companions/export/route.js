import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data: companions, error } = await supabase.from('companions').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const logoPath = path.join(process.cwd(), 'app', 'icon.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = logoBuffer.toString('base64')
  const logoDataUri = `data:image/png;base64,${logoBase64}`

  const html = buildHtml(companions ?? [], logoDataUri)

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

function buildHtml(companions, logoSrc) {
  const rows = companions.map((c, i) =>
    `<tr>
      <td style="color:rgba(255,255,255,0.3);text-align:center;">${i + 1}</td>
      <td style="color:#ffffff;"><strong>${esc(c.name)}</strong></td>
      <td style="font-weight:600;color:#3ecf8e;">${esc(c.rank)}</td>
      <td style="font-size:12px;color:#8888a8;min-width:200px;">${esc(c.notes)}</td>
    </tr>`
  ).join('')

  const css = [
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    /* Force background to bleed to edges */
    "html, body { min-height: 100vh; background: #0a0a0f; margin: 0; }",
    /* Professional scale for A4 landscape */
    "body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #eeeef5; padding: 20mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 20px 0; border-bottom: 3px solid #D63027; margin-bottom: 32px; }',
    '.header-logo { font-size: 19px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px; }',
    '.header-sub { font-size: 12px; color: #8888a8; margin-top: 4px; }',
    '.report-title { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }',
    '.section-title { font-size: 16px; font-weight: 700; color: #ffffff; border-left: 4px solid #D63027; padding-left: 12px; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.5px; }',
    /* Tables with solid borders for high visibility */
    '.data-table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table th { background: #14141e; color: #ffffff; padding: 12px 10px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.15); }',
    '.data-table td { padding: 12px 10px; border: 1px solid rgba(255,255,255,0.15); vertical-align: top; line-height: 1.6; color: #cccccc; }',
    '.data-table tr:nth-child(even) td { background: rgba(255,255,255,0.03); }',
    '.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.15); font-size: 11px; color: #8888a8; display: flex; align-items: center; justify-content: space-between; }',
    '.footer-left { color: #D63027; font-weight: 600; font-size: 12px; }',
  ].join(' ')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  ${css} 
  @media print { 
    .no-print { display: none !important; } 
    /* Force true full-screen A4 landscape */
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
  <div style="font-size:12px;color:#8888a8;text-align:right;">Companions Report<br>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
<div class="report-title">Companions — ${companions.length} total</div>
<div class="section-title">Companions List</div>
<table class="data-table">
  <thead><tr><th style="width:40px;">#</th><th>Name</th><th>Rank</th><th>Notes</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <span class="footer-left">HTU · htu.edu.jo</span>
  <span>Students Recruitment &amp; Outreach Office Manager · Dalia Zawaideh</span>
  <span>King Hussein Business Park, Amman, Jordan</span>
</div>
</body></html>`
}