'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, GraduationCap, Activity, AlertCircle, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, PieChart, Pie, ComposedChart, Line, CartesianGrid
} from 'recharts'

// ─── Design tokens (matching your existing dashboard) ───────────────────────
const C = {
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  amber:   '#f59e0b',
  green:   '#10b981',
  pink:    '#ec4899',
  cyan:    '#06b6d4',
  orange:  '#f97316',
  red:     '#ef4444',
}
const MAJOR_COLORS = [C.blue, C.purple, C.cyan, C.green, C.amber, C.orange, C.pink, '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa']
const TOOLTIP_STYLE = { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', color: '#fff' }

// ─── Reusable components ─────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '22px 24px', ...style
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px 0' }}>{children}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// Animated KPI number
function KPI({ value, label, sub, color, icon: Icon }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let start = 0
    const step = Math.ceil(value / 40)
    const t = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(t) }
      else setDisplay(start)
    }, 18)
    return () => clearInterval(t)
  }, [value])

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '30px', fontWeight: '800', color, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
          {display.toLocaleString()}
        </p>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', margin: '0 0 2px 0' }}>{label}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// Gender split bar
function GenderBar({ male, female }) {
  const total = male + female
  const malePct  = total ? Math.round(male  / total * 100) : 0
  const femPct   = total ? Math.round(female / total * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
<span style={{ fontSize: '12px', color: C.blue,  fontWeight: '700' }}>♂ {malePct || 0}% <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>({(male || 0).toLocaleString()})</span></span>
         <span style={{ fontSize: '12px', color: C.pink,  fontWeight: '700' }}>♀ {femPct || 0}% <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>({(female || 0).toLocaleString()})</span></span>      </div>
      <div style={{ height: '10px', borderRadius: '6px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ width: `${malePct}%`, background: `linear-gradient(90deg, ${C.blue}, #60a5fa)`, transition: 'width 1s ease', borderRadius: '6px 0 0 6px' }} />
        <div style={{ width: `${femPct}%`, background: `linear-gradient(90deg, #f472b6, ${C.pink})`, transition: 'width 1s ease', borderRadius: '0 6px 6px 0' }} />
      </div>
    </div>
  )
}

// Horizontal % bar row
function PctRow({ label, count, total, color, bold }) {
  const pct = total ? Math.round(count / total * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: bold ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: bold ? '600' : '400' }}>{label}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{(count || 0).toLocaleString()}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>{pct || 0}%</span>
        </div>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

// Custom treemap content
function TreemapNode({ x, y, width, height, name, count, male, female, depth, color }) {
  if (width < 30 || height < 20) return null
  const total = (male || 0) + (female || 0) + (count || 0)
  const malePct = total ? Math.round((male || 0) / total * 100) : 0
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} rx={6} style={{ fill: color || '#1e293b', fillOpacity: 0.85, stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
      {width > 60 && height > 30 && (
        <>
          <text x={x + 10} y={y + 18} style={{ fontSize: Math.min(12, width / 8), fill: '#fff', fontWeight: '600', fontFamily: 'inherit' }}>
            {name?.length > Math.floor(width / 7) ? name.slice(0, Math.floor(width / 7)) + '…' : name}
          </text>
          {height > 44 && (
            <text x={x + 10} y={y + 32} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>
              {(male || count || 0).toLocaleString()} {male !== undefined ? '♂' : ''}
              {female != null ? `  ${(female || 0).toLocaleString()} ♀` : ''}
            </text>
          )}
          {height > 56 && malePct > 0 && (
            <text x={x + 10} y={y + 46} style={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>
              {malePct}% male
            </text>
          )}
        </>
      )}
    </g>
  )
}

// Custom tooltip for grade chart
function GradeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Grade {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: '12px', fontWeight: '600', color: p.fill }}>
          {p.name}: {p.value} students
        </p>
      ))}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PreviousYearsAnalyticsPage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const initialYear   = searchParams.get('year') || ''

  const [cohorts,  setCohorts]  = useState([])
  const [selYear,  setSelYear]  = useState(initialYear)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [showDrop, setShowDrop] = useState(false)

  useEffect(() => { fetchCohorts() }, [])
  useEffect(() => { if (selYear) fetchAnalytics(selYear) }, [selYear])

  const fetchCohorts = async () => {
    const res  = await fetch('/api/previous-years')
    const list = await res.json()
    setCohorts(Array.isArray(list) ? list : [])
    if (!selYear && list.length > 0) setSelYear(String(list[0].year))
  }

  const fetchAnalytics = async (year) => {
    setLoading(true); setData(null)
    try {
      const res = await fetch(`/api/previous-years/${year}/analytics`)
      const d   = await res.json()
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const selectedCohort = cohorts.find(c => String(c.year) === String(selYear))

  // ── Prepare chart data ──────────────────────────────────────────────────
  const treemapData = data?.degreeTree?.map((deg, di) => ({
    name: deg.name,
    color: [C.blue, C.purple, C.amber, C.green][di % 4],
    children: deg.children.map((maj, mi) => ({
      name: maj.name,
      size: maj.count,
      count: maj.count,
      male:  maj.male,
      female: maj.female,
      color: MAJOR_COLORS[mi % MAJOR_COLORS.length],
    }))
  })) || []

const flatTreemap = Object.values(
  treemapData.flatMap(d => d.children).reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { ...item }
    } else {
      acc[item.name].size   += item.size
      acc[item.name].count  += item.count
      acc[item.name].male   += item.male
      acc[item.name].female += item.female
    }
    return acc
  }, {})
)
  const radarData = data?.majorGenderData?.slice(0, 8).map(m => ({
    major: m.major?.length > 14 ? m.major.slice(0, 14) + '…' : m.major,
    Male:   m.Male,
    Female: m.Female,
  })) || []

  const govData = data?.governorateData?.slice(0, 10) || []

  const donutDegree = data?.degreeCounts?.map((d, i) => ({
    ...d, fill: [C.blue, C.amber, C.green, 'rgba(255,255,255,0.2)'][i % 4]
  })) || []

  const donutStream = data?.streamCounts?.map((d, i) => ({
    ...d, fill: [C.purple, C.cyan, C.orange, C.green, C.amber, C.pink][i % 6]
  })) || []

  const donutSchool = data?.schoolTypeCounts?.map((d, i) => ({
    ...d, fill: [C.purple, C.cyan, 'rgba(255,255,255,0.25)'][i % 3]
  })) || []

  // ── Donut chart helper ──
  const DonutChart = ({ data: d, title, sub, size = 180 }) => {
    const [active, setActive] = useState(null)
    const total = d.reduce((s, x) => s + x.count, 0)
    const cx = size / 2, cy = size / 2
    const ir = size * 0.29, or = size * 0.44
    return (
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          <PieChart width={size} height={size}>
            <Pie data={d} cx={cx} cy={cy} innerRadius={ir} outerRadius={or}
              dataKey="count" paddingAngle={2} strokeWidth={0}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
              {d.map((entry, i) => (
                <Cell key={i} fill={entry.fill} opacity={active === null || active === i ? 1 : 0.35}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v.toLocaleString()} · ${Math.round(v / total * 100)}%`]} />
          </PieChart>
        </div>
        <div style={{ flex: 1 }}>
          {d.map((item, i) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
              opacity: active === null || active === i ? 1 : 0.35, transition: 'opacity 0.2s', cursor: 'default' }}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.fill, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1, textTransform: 'capitalize' }}>{item.name}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: item.fill }}>{Math.round(item.count / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pill badge for has/not ──
  const BoolStat = ({ trueVal, falseVal, trueLabel, falseLabel, trueColor, falseColor }) => {
    const total = trueVal + falseVal
    const truePct  = total ? Math.round(trueVal  / total * 100) : 0
    const falsePct = total ? Math.round(falseVal / total * 100) : 0
    return (
      <div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: `${trueColor}12`, border: `1px solid ${trueColor}25`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: trueColor, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{truePct}%</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{trueLabel}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 0' }}>{(trueVal || 0).toLocaleString()} students</p>
          </div>
          <div style={{ flex: 1, background: `${falseColor}12`, border: `1px solid ${falseColor}25`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: falseColor, margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{falsePct}%</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{falseLabel}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 0' }}>{(falseVal || 0).toLocaleString()} students</p>
          </div>
        </div>
        <div style={{ height: '6px', borderRadius: '4px', overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ width: `${truePct}%`, background: trueColor, transition: 'width 1s ease' }} />
          <div style={{ width: `${falsePct}%`, background: falseColor, transition: 'width 1s ease' }} />
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => router.push('/dashboard/analytics')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 3px 0', letterSpacing: '-0.5px' }}>
              Previous Years Analytics
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {selectedCohort ? `${selectedCohort.label} · ${selectedCohort.total_imported?.toLocaleString()} students` : 'Select a cohort to explore'}
            </p>
          </div>
        </div>

        {/* Year selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowDrop(d => !d)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '600',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <GraduationCap size={15} color="rgba(255,255,255,0.4)" />
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedCohort?.label || 'Select year'}</span>
            <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ transform: showDrop ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showDrop && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '180px', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', zIndex: 100 }}>
              {cohorts.map(c => (
                <button key={c.id} onClick={() => { setSelYear(String(c.year)); setShowDrop(false) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', fontWeight: String(c.year) === String(selYear) ? '700' : '400', color: String(c.year) === String(selYear) ? C.blue : 'rgba(255,255,255,0.6)', background: String(c.year) === String(selYear) ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c.label}
                  <span style={{ float: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{c.total_imported?.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Crunching the numbers…</p>
        </div>
      )}

      {/* ── Empty / No cohort ── */}
      {!loading && !data && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <AlertCircle size={32} color="rgba(255,255,255,0.15)" />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Select a cohort year to see analytics</p>
        </div>
      )}

      {!loading && data && !data.empty && (
        <>
          {/* ══ ROW 1 — KPI Cards ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <KPI value={data.total}         label="Total Applicants"   sub="imported this cohort"     color={C.blue}   icon={Users} />
            <KPI value={data.male}           label="Male Applicants"    sub={`${Math.round(data.male / data.total * 100)}% of cohort`}   color={C.blue}   icon={Users} />
            <KPI value={data.female}         label="Female Applicants"  sub={`${Math.round(data.female / data.total * 100)}% of cohort`} color={C.pink}   icon={Users} />
            <KPI value={data.hasStudentNo}   label="Enrolled (Has ID)"  sub={`${Math.round(data.hasStudentNo / data.total * 100)}% converted`} color={C.green}  icon={Activity} />
          </div>

          {/* ══ ROW 2 — Gender bar + Degree donut + Stream donut ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* Gender split */}
            <Card>
              <CardTitle sub="male vs female distribution">Gender Split</CardTitle>
              <GenderBar male={data.male} female={data.female} />
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  { label: 'Male',   val: data.male,   color: C.blue },
                  { label: 'Female', val: data.female, color: C.pink },
                ].map(g => (
                  <PctRow key={g.label} label={g.label} count={g.val} total={data.total} color={g.color} />
                ))}
              </div>
            </Card>

            {/* Degree donut */}
            <Card>
              <CardTitle sub="by program level">Degree Breakdown</CardTitle>
              <DonutChart data={donutDegree} size={170} />
            </Card>

            {/* Academic Stream donut */}
            <Card>
              <CardTitle sub="high school stream">Academic Stream</CardTitle>
              <DonutChart data={donutStream} size={170} />
            </Card>
          </div>

          {/* ══ ROW 3 — Major × Gender TREEMAP (full width) ══ */}
          <Card style={{ marginBottom: '14px' }}>
            <CardTitle sub="size = number of applicants · color per major · hover for male / female breakdown">
              Major × Gender Map
            </CardTitle>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {data.degreeCounts?.map((d, i) => {
                const color = [C.blue, C.amber, C.green, 'rgba(255,255,255,0.3)'][i % 4]
                return (
                  <span key={d.name} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: `${color}15`, border: `1px solid ${color}25`, color }}>
                    {d.name} · {(d.count || 0).toLocaleString()}
                  </span>
                )
              })}
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <Treemap
                data={flatTreemap}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<TreemapNode />}
              >
                <Tooltip contentStyle={TOOLTIP_STYLE} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  const tot = (d.male || 0) + (d.female || 0)
                  return (
                    <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: '#fff' }}>{d.name}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: C.blue }}>♂ Male: {(d.male || 0).toLocaleString()}</p>
                      <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: C.pink }}>♀ Female: {(d.female || 0).toLocaleString()}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Total: {tot.toLocaleString()}</p>
                    </div>
                  )
                }} />
              </Treemap>
            </ResponsiveContainer>
          </Card>

          {/* ══ ROW 4 — Major × Gender stacked bar + Tawjihi grade distribution ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', marginBottom: '14px' }}>

            {/* Major × Gender stacked bar */}
            <Card>
              <CardTitle sub="male (blue) vs female (pink) per major">Applicants by Major & Gender</CardTitle>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.majorGenderData} layout="vertical" margin={{ left: 8, right: 36, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="major" width={190}
                    tick={({ x, y, payload }) => (
                      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.5)" fontFamily="inherit">
                        {payload.value?.length > 22 ? payload.value.slice(0, 22) + '…' : payload.value}
                      </text>
                    )}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v.toLocaleString()} students`, n]} />
                  <Bar dataKey="Male"   stackId="s" fill={C.blue} radius={[0, 0, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Female" stackId="s" fill={C.pink} radius={[0, 4, 4, 0]} maxBarSize={20}
                    label={{ position: 'right', formatter: (v, _, index) => {
                      const row = data.majorGenderData[index]
                      return row ? (row.total || 0).toLocaleString() : ''
                    }, fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Tawjihi grade distribution */}
            <Card>
              <CardTitle sub="score distribution by gender">Tawjihi Grade Distribution</CardTitle>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data.gradeDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GradeTooltip />} />
                  <Bar dataKey="Male"   fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="Female" fill={C.pink} radius={[4, 4, 0, 0]} maxBarSize={34} />
                  <Line type="monotone" dataKey="total" stroke={C.amber} strokeWidth={2} dot={{ fill: C.amber, r: 3 }} strokeDasharray="4 2" />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: 'rgba(255,255,255,0.4)' }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Avg tawjihi callout */}
              {(() => {
const vals = (data?.gradeDistribution || []).reduce((s, d) => ({ sum: s.sum + d.total * (parseInt(d.range) + 2.5), cnt: s.cnt + d.total }), { sum: 0, cnt: 0 });                return (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Cohort Tawjihi Average</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: C.amber, letterSpacing: '-0.5px' }}>
                      ~{(vals.sum / vals.cnt).toFixed(1)}
                    </span>
                  </div>
                )
              })()}
            </Card>
          </div>

          {/* ══ ROW 5 — Top Avg Tawjihi by Major + Governorate ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* Avg Tawjihi by Major */}
            <Card>
              <CardTitle sub="average tawjihi score per major (top 12)">Grade Leaders by Major</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.majorAvgData} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[70, 100]} hide />
                  <YAxis type="category" dataKey="major" width={185}
                    tick={({ x, y, payload }) => (
                      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.5)" fontFamily="inherit">
                        {payload.value?.length > 22 ? payload.value.slice(0, 22) + '…' : payload.value}
                      </text>
                    )}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} avg · based on ${data.majorAvgData?.find(m => m.avg === v)?.count || ''} students`]} />
                  <Bar dataKey="avg" radius={[0, 6, 6, 0]} maxBarSize={18}
                    label={{ position: 'right', fill: 'rgba(255,255,255,0.35)', fontSize: 10, formatter: v => v }}>
                    {data.majorAvgData?.map((entry, i) => (
                      <Cell key={i} fill={entry.avg >= 90 ? C.green : entry.avg >= 85 ? C.blue : entry.avg >= 80 ? C.amber : C.orange} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Governorate */}
            <Card>
              <CardTitle sub="certificate governorate of origin">Applicants by Region</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {govData.map((g, i) => (
                  <PctRow key={g.name} label={g.name} count={g.count} total={data.total}
                    color={i === 0 ? C.blue : i < 3 ? C.purple : 'rgba(255,255,255,0.35)'} bold={i < 3} />
                ))}
              </div>
            </Card>
          </div>

          {/* ══ ROW 6 — School Type + Top Schools + Student No + Disability ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.4fr 0.6fr', gap: '12px', marginBottom: '14px' }}>

            {/* School Type */}
            <Card>
              <CardTitle sub="private vs governmental">School Type</CardTitle>
              <DonutChart data={donutSchool} size={160} />
            </Card>

            {/* Top Schools */}
            <Card>
              <CardTitle sub="top 15 schools by applicant count">Top Feeder Schools</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topSchools?.slice(0, 12)} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={200}
                    tick={({ x, y, payload }) => (
                      <text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.5)" fontFamily="inherit">
                        {payload.value?.length > 26 ? payload.value.slice(0, 26) + '…' : payload.value}
                      </text>
                    )}
                    axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} applicants`]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={16}
                    label={{ position: 'right', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                    {data.topSchools?.slice(0, 12).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? C.amber : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3a' : C.blue}
                        fillOpacity={1 - i * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Student No + Disability stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Card style={{ flex: 1 }}>
                <CardTitle sub="HTU student number assigned">Enrollment Status</CardTitle>
                <BoolStat
                  trueVal={data.hasStudentNo} falseVal={data.noStudentNo}
                  trueLabel="Has Student No" falseLabel="No Number Yet"
                  trueColor={C.green} falseColor="rgba(255,255,255,0.2)"
                />
              </Card>
              <Card style={{ flex: 1 }}>
                <CardTitle sub="applicants with disabilities">Disability Status</CardTitle>
                <BoolStat
                  trueVal={data.hasDisability} falseVal={data.noDisability}
                  trueLabel="Has Disability" falseLabel="No Disability"
                  trueColor={C.amber} falseColor="rgba(255,255,255,0.2)"
                />
              </Card>
            </div>
          </div>

          {/* ══ ROW 7 — Radar (major distribution shape) + Nationality + Application Status ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>

            {/* Radar — top 8 majors, male vs female */}
            <Card>
              <CardTitle sub="top 8 majors · male vs female shape">Major Gender Radar</CardTitle>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="major" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Male"   dataKey="Male"   stroke={C.blue} fill={C.blue} fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Female" dataKey="Female" stroke={C.pink} fill={C.pink} fillOpacity={0.12} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            {/* Nationality */}
            <Card>
              <CardTitle sub="top nationalities">Nationality Breakdown</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                {data.nationalityData?.slice(0, 10).map((n, i) => (
                  <PctRow key={n.name} label={n.name?.trim()} count={n.count} total={data.total}
                    color={i === 0 ? C.blue : i < 3 ? C.cyan : 'rgba(255,255,255,0.3)'} bold={i < 2} />
                ))}
              </div>
            </Card>

            {/* Application Status */}
            <Card>
              <CardTitle sub="breakdown of application outcomes">Application Status</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                {data.statusData?.map((s, i) => {
                  const color = s.name?.toLowerCase().includes('accept') ? C.green
                    : s.name?.toLowerCase().includes('reject') ? C.red
                    : s.name?.toLowerCase().includes('fail') ? C.orange
                    : s.name?.toLowerCase().includes('abstain') ? 'rgba(255,255,255,0.3)'
                    : MAJOR_COLORS[i % MAJOR_COLORS.length]
                  return <PctRow key={s.name} label={s.name} count={s.count} total={data.total} color={color} />
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Empty cohort */}
      {!loading && data?.empty && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
          <AlertCircle size={32} color="rgba(255,255,255,0.15)" />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>No data imported for this cohort yet.</p>
          <button onClick={() => router.push('/dashboard/applicants/previous-years')}
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', color: C.blue, cursor: 'pointer' }}>
            Go Import Data
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px }
      `}</style>
    </div>
  )
}