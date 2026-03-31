'use client'
import { FileText } from 'lucide-react'
import { logActivity } from '@/lib/logger'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, CheckCircle, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

export default function SchoolVisitsPage() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingVisit, setCompletingVisit] = useState(null)
  const [completionComment, setCompletionComment] = useState('')
  const [completionImages, setCompletionImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [completions, setCompletions] = useState({})
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false)
  const supabase = createClient()

 const emptyForm = {
    school_name: '',
    type: 'School Tours',
    city: '',
    country: '',
    private_or_public: 'private',
    visit_date: '',
    visit_time: '',
    connection_status: 'New',
    reminder_time: 'none', 
    qstash_message_id: null,
  }

  const [form, setForm] = useState(emptyForm)

 const fetchVisits = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('school_visits')
      .select('*')
      .order('visit_date', { ascending: true }) // Earliest dates first
      .order('visit_time', { ascending: true }) // If same date, sort by earliest time
    if (!error) setVisits(data)
    setLoading(false)
  }

  const fetchCompletions = async () => {
    const { data, error } = await supabase.from('visit_completions').select('*')
    if (!error) {
      const map = {}
      data.forEach(c => { map[c.visit_id] = c })
      setCompletions(map)
    }
  }

  const handleSubmit = async () => {
    if (!form.school_name || !form.visit_date || !form.visit_time) {
      alert('Please fill in school name, visit date, and visit time to set a reminder.')
      return
    }

    const payload = {
      ...form,
      visit_time: form.visit_time === '' ? null : form.visit_time,
    }

    let savedVisit;

    if (editingVisit) {
      const { data, error } = await supabase.from('school_visits').update(payload).eq('id', editingVisit.id).select().single()
      if (error) { alert('Update Error: ' + error.message); return }
      savedVisit = data;
      await logActivity('Edited school visit', 'school_visit', payload.school_name, 'Updated visit details')
    } else {
      const { data, error } = await supabase.from('school_visits').insert([payload]).select().single()
      if (error) { alert('Insert Error: ' + error.message); return }
      savedVisit = data;
      await logActivity('Created school visit', 'school_visit', payload.school_name, 'New visit added')
    }
    
    // --- Trigger Background Schedule API ---
    try {
      // ONLY call the API if a reminder is selected
      if (form.reminder_time !== 'none') {
        const res = await fetch('/api/schedule-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit_id: savedVisit.id,
            school_name: savedVisit.school_name,
            visit_date: savedVisit.visit_date,
            visit_time: savedVisit.visit_time,
            reminder: savedVisit.reminder_time,
            old_message_id: savedVisit.qstash_message_id
          })
        });
        
        const scheduleData = await res.json();
        
        if (scheduleData.error) {
          alert(scheduleData.error);
        }
        
        if (scheduleData.messageId) {
          await supabase.from('school_visits').update({ qstash_message_id: scheduleData.messageId }).eq('id', savedVisit.id);
        }
      }} catch (err) {
      console.error("Failed to schedule reminder:", err);
    }

    fetchVisits(); setShowForm(false); setEditingVisit(null); setForm(emptyForm)
  }
 const handleEdit = (visit) => {
    setEditingVisit(visit)
    setForm({
      school_name: visit.school_name,
      type: visit.type,
      city: visit.city || '',
      country: visit.country || '',
      private_or_public: visit.private_or_public,
      visit_date: visit.visit_date,
      visit_time: visit.visit_time || '',
      connection_status: visit.connection_status || 'New',
      reminder_time: visit.reminder_time || '60',
      qstash_message_id: visit.qstash_message_id || null,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this visit?')) return
    const visit = visits.find(v => v.id === id)
    const { error } = await supabase.from('school_visits').delete().eq('id', id)
    if (!error) {
      await logActivity('Deleted school visit', 'school_visit', visit?.school_name, 'School visit removed')
      fetchVisits()
    }
  }

  const handleMarkDone = (visit) => {
    setCompletingVisit(visit)
    setCompletionComment('')
    setCompletionImages([])
    setShowCompleteModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setUploadingImages(true)
    const uploadedUrls = []
    for (const file of files) {
      const fileName = Date.now() + '-' + file.name
      const { data, error } = await supabase.storage.from('task-images').upload(fileName, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('task-images').getPublicUrl(data.path)
        uploadedUrls.push(urlData.publicUrl)
      }
    }
    setCompletionImages(prev => [...prev, ...uploadedUrls])
    setUploadingImages(false)
  }

  const handleCompleteSubmit = async () => {
    if (!completionComment) {
      alert('Please write what you accomplished during this visit')
      return
    }
    // Using upsert with onConflict ensures only ONE completion exists per visit
    const { error } = await supabase.from('visit_completions').upsert({
      visit_id: completingVisit.id,
      comment: completionComment,
      images: completionImages,
    }, { onConflict: 'visit_id' })
    if (!error) {
      await logActivity('Completed school visit', 'school_visit', completingVisit?.school_name, completionComment)
      setShowCompleteModal(false)
      setCompletingVisit(null)
      setCompletionComment('')
      setCompletionImages([])
      fetchCompletions()
    }
  }

const handleUndoComplete = async (visitId) => {
    if (!confirm('Are you sure you want to undo this completion?')) return
    const { error } = await supabase.from('visit_completions').delete().eq('visit_id', visitId)
    if (!error) {
      await logActivity('Undid visit completion', 'school_visit', visits.find(v=>v.id===visitId)?.school_name, 'Moved back to pending')
      fetchCompletions()
    } else {
      alert('Error undoing: ' + error.message)
    }
  }

  const generateWord = async (visit = null) => {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType,
  } = await import('docx')
  const { saveAs } = await import('file-saver')

  const isAll = !visit

  const RED = 'C0392B'
  const WHITE = 'FFFFFF'
  const LIGHT_GRAY = 'F5F5F5'
  const DARK_GRAY = '2C2C2C'
  const MID_GRAY = '666666'

  const redHeading = (text) => new Paragraph({
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED } },
    children: [new TextRun({
      text,
      bold: true,
      size: 26,
      color: RED,
      font: 'Calibri',
    })],
  })

  const sectionLabel = (label, value) => new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 20, color: DARK_GRAY, font: 'Calibri' }),
      new TextRun({ text: value || '-', size: 20, color: MID_GRAY, font: 'Calibri' }),
    ],
  })

  const divider = () => new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E0E0E0' } },
    children: [new TextRun({ text: '' })],
  })

  const sections = []

  // ── COVER HEADER ────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      shading: { type: ShadingType.SOLID, color: RED, fill: RED },
      children: [new TextRun({ text: '  HTU Outreach CRM  ', bold: true, size: 40, color: WHITE, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      shading: { type: ShadingType.SOLID, color: RED, fill: RED },
      children: [new TextRun({
        text: isAll ? '  School Visits Report  ' : '  School Visit Report  ',
        size: 26, color: WHITE, font: 'Calibri',
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      shading: { type: ShadingType.SOLID, color: RED, fill: RED },
      children: [new TextRun({
        text: 'Dalia Zawaideh  ',
        italics: true, size: 22, color: 'FFCCCC', font: 'Calibri',
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      shading: { type: ShadingType.SOLID, color: RED, fill: RED },
      children: [new TextRun({
        text: '  Generated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '  ',
        size: 20, color: 'FFCCCC', font: 'Calibri',
      })],
    }),
    new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: '' })] }),
  )

  if (isAll) {
    // ── SUMMARY SECTION ────────────────────────────────────────────────
    sections.push(redHeading('Executive Summary'))
    sections.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: 'This report provides a comprehensive overview of all school visits conducted by the HTU Outreach team.',
        size: 20, color: MID_GRAY, font: 'Calibri', italics: true,
      })],
    }))

    const summaryTable = new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: RED, fill: RED },
              children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true, color: WHITE, size: 20, font: 'Calibri' })] })],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: RED, fill: RED },
              children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true, color: WHITE, size: 20, font: 'Calibri' })] })],
            }),
          ],
        }),
        ...[
          ['Total School Visits', String(visits.length)],
          ['Completed Visits', String(Object.keys(completions).length)],
          ['Pending Visits', String(visits.length - Object.keys(completions).length)],
          ['Total Students Collected', String(visitStudents.length)],
        ].map(([label, value], i) => new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT_GRAY : WHITE, fill: i % 2 === 0 ? LIGHT_GRAY : WHITE },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri', color: DARK_GRAY })] })],
            }),
            new TableCell({
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT_GRAY : WHITE, fill: i % 2 === 0 ? LIGHT_GRAY : WHITE },
              children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Calibri', color: MID_GRAY })] })],
            }),
          ],
        })),
      ],
    })
    sections.push(summaryTable)
    sections.push(divider())

    // ── ALL VISITS TABLE ───────────────────────────────────────────────
    sections.push(redHeading('All School Visits'))

    const headerCols = ['School Name', 'Type', 'City', 'Date', 'Time', 'Status', 'Completed', 'Students']
    const headerRow = new TableRow({
      children: headerCols.map(text => new TableCell({
        shading: { type: ShadingType.SOLID, color: RED, fill: RED },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: 'Calibri' })] })],
      })),
    })

    const dataRows = visits.map((v, i) => new TableRow({
      children: [
        v.school_name,
        v.type,
        v.city || '-',
        v.visit_date || '-',
        v.visit_time || '-',
        v.connection_status || 'New',
        completions[v.id] ? 'Yes' : 'No',
        String(visitStudents.filter(vs => vs.visit_id === v.id).length),
      ].map(text => new TableCell({
        shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT_GRAY : WHITE, fill: i % 2 === 0 ? LIGHT_GRAY : WHITE },
        children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 18, font: 'Calibri', color: DARK_GRAY })] })],
      })),
    }))

    sections.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }))

  } else {
    // ── SINGLE VISIT ───────────────────────────────────────────────────
    sections.push(redHeading('Visit Details'))

    sections.push(
      sectionLabel('School Name', visit.school_name),
      sectionLabel('Visit Date', visit.visit_date || '-'),
      sectionLabel('Visit Time', visit.visit_time || '-'),
      sectionLabel('Visit Type', visit.type),
      sectionLabel('School Type', visit.private_or_public || '-'),
      sectionLabel('City', visit.city || '-'),
      sectionLabel('Country', visit.country || '-'),
      sectionLabel('Connection Status', visit.connection_status || 'New'),
    )

    sections.push(divider())
    sections.push(redHeading('What Was Accomplished'))
    sections.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: completions[visit.id]?.comment || 'Not marked as done yet.',
        size: 20, color: DARK_GRAY, font: 'Calibri',
      })],
    }))

    const students = visitStudents.filter(vs => vs.visit_id === visit.id)
    sections.push(divider())
    sections.push(redHeading('Students Collected (' + students.length + ')'))

    if (students.length > 0) {
      const studentCols = ['Name', 'Email', 'Phone', 'Grade', 'Major Interested', 'Matched']
      const studentHeaderRow = new TableRow({
        children: studentCols.map(text => new TableCell({
          shading: { type: ShadingType.SOLID, color: RED, fill: RED },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: 'Calibri' })] })],
        })),
      })
      const studentRows = students.map((s, i) => new TableRow({
        children: [
          s.full_name, s.email || '-', s.phone || '-',
          s.grade || '-', s.major_interested || '-', s.is_matched ? 'Yes' : 'No',
        ].map(text => new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT_GRAY : WHITE, fill: i % 2 === 0 ? LIGHT_GRAY : WHITE },
          children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 18, font: 'Calibri', color: DARK_GRAY })] })],
        })),
      }))
      sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [studentHeaderRow, ...studentRows],
      }))
    } else {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'No students were collected during this visit.', size: 20, color: MID_GRAY, font: 'Calibri', italics: true })],
      }))
    }
  }

  // ── FOOTER ─────────────────────────────────────────────────────────
  sections.push(
    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: '' })] }),
    divider(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: 'HTU Student Recruitment & Outreach Office  |  Prepared for Dalia Zawaideh',
        size: 16, color: MID_GRAY, font: 'Calibri', italics: true,
      })],
    }),
  )

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 900, right: 900 },
        },
      },
      children: sections,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const filename = isAll
    ? 'HTU_All_Visits_Report.docx'
    : 'HTU_Visit_' + (visit.school_name.replace(/[\u0600-\u06FF\s]+/g, '') || 'Report') + '.docx'
  saveAs(blob, filename)
  await logActivity('Exported Word Doc', 'school_visit', isAll ? 'All Visits' : visit.school_name, 'Word document generated')
}
 const [visitStudents, setVisitStudents] = useState([])

  const fetchVisitStudents = async () => {
    const { data } = await supabase.from('visit_students').select('*')
    if (data) setVisitStudents(data)
  }

  useEffect(() => {
    fetchVisits()
    fetchCompletions()
    fetchVisitStudents()
  }, [])


  const filteredVisits = filterType === 'all' ? visits : visits.filter(v => v.type === filterType)

  const pendingVisits = filteredVisits.filter(v => !completions[v.id])
  const completedVisits = filteredVisits.filter(v => completions[v.id])

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>School Visits</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage all school tours and fair visits</p>
        </div>
       <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => generateWord(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}
          >
            <FileText size={16} />
            Export All Word
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingVisit(null); setForm(emptyForm) }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          >
            <Plus size={16} />
            Add Visit
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'School Tours', 'School visits at HTU Campus', 'School Fairs', 'Outreach fairs', 'Outreach School Tours', 'Outreach Events'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: filterType === type ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: filterType === type ? '#3b82f6' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Table */}
    {/* Pending Visits Table */}
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>Upcoming / Pending Visits ({pendingVisits.length})</h2>
      </div>
      <div style={{ ...s.card, marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
{['School Name', 'Type', 'School Type', 'City', 'Date', 'Time', 'Status','Accomplished', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>Loading...</td></tr> : 
             pendingVisits.length === 0 ? <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No pending visits</td></tr> : 
             pendingVisits.map((visit) => (
                <tr key={visit.id} style={{ transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                 <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{visit.school_name}</td>
                  <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{visit.type}</span></td>
                  <td style={s.td}><span style={{ textTransform: 'capitalize' }}>{visit.private_or_public || '-'}</span></td>
                  <td style={s.td}>{visit.city || '-'}</td>
                  <td style={s.td}>{visit.visit_date}</td>
                  <td style={s.td}>{visit.visit_time || '-'}</td>
                  <td style={s.td}><span style={{ color: visit.connection_status === 'New' ? '#10b981' : '#f59e0b', fontWeight: '500' }}>{visit.connection_status || 'New'}</span></td>
                  <td style={s.td}>
                    <button onClick={() => handleMarkDone(visit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <CheckCircle size={13} /> Mark Done
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                      <button onClick={() => generateWord(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><FileText size={14} /></button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Completed Visits Table */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#10b981' }}>Completed Visits ({completedVisits.length})</h2>
        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
          {isCompletedCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      
      {!isCompletedCollapsed && (
        <div style={{ ...s.card, opacity: 0.8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
{['School Name', 'Type', 'School Type', 'Date', 'Accomplished', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}              </tr>
            </thead>
            <tbody>
              {completedVisits.length === 0 ? <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', padding: '40px' }}>No completed visits yet</td></tr> : 
               completedVisits.map((visit) => (
                  <tr key={visit.id} style={{ background: 'rgba(16,185,129,0.02)' }}>
                    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500', textDecoration: 'line-through', opacity: 0.7 }}>{visit.school_name}</td>
                    <td style={s.td}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{visit.type}</span></td>
                    <td style={s.td}><span style={{ textTransform: 'capitalize' }}>{visit.private_or_public || '-'}</span></td>
                    <td style={s.td}>{visit.visit_date}</td>
                    <td style={s.td}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✓ Done</span>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completions[visit.id].comment}</p>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUndoComplete(visit.id)} title="Undo Completion" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}><RotateCcw size={14} /></button>
                        <button onClick={() => handleEdit(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(visit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><Trash2 size={14} /></button>
                        <button onClick={() => generateWord(visit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}><FileText size={14} /></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
              {editingVisit ? 'Edit Visit' : 'Add New Visit'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'School Name *', key: 'school_name', type: 'text', placeholder: 'e.g. Al-Ahliyya School' },
                { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. Amman' },
                { label: 'Country', key: 'country', type: 'text', placeholder: 'e.g. Jordan' },
                { label: 'Visit Date *', key: 'visit_date', type: 'date', placeholder: '' },
                { label: 'Visit Time', key: 'visit_time', type: 'time', placeholder: '' },
              ].map(field => (
                <div key={field.key}>
                  <label style={s.label}>{field.label}</label>
                  <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={s.input}>
                  <option value="School Tours">School Tours</option>
                  <option value="School visits at HTU Campus">School visits at HTU Campus</option>
                  <option value="School Fairs">School Fairs</option>
                  <option value="Outreach fairs">Outreach fairs</option>
                  <option value="Outreach School Tours">Outreach School Tours</option>
                  <option value="Outreach Events">Outreach Events</option>
                </select>
              </div>
              <div>
                <label style={s.label}>School Type *</label>
                <select value={form.private_or_public} onChange={(e) => setForm({ ...form, private_or_public: e.target.value })} style={s.input}>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Status (New/Repeated) *</label>
                <select value={form.connection_status} onChange={(e) => setForm({ ...form, connection_status: e.target.value })} style={s.input}>
                  <option value="New">New</option>
                  <option value="Repeated">Repeated</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Reminder Notice *</label>
                <select value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} style={s.input}>
                  <option value="none">No Reminder</option>
                  <option value="30">30 Minutes Before</option>
                  <option value="60">1 Hour Before</option>
                  <option value="120">2 Hours Before</option>
                  <option value="1440">1 Day Before</option>
                  <option value="2880">2 Days Before</option>
                  <option value="10080">1 Week Before</option>
                </select>
              </div>
              
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingVisit ? 'Save Changes' : 'Add Visit'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingVisit(null); setForm(emptyForm) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Visit Modal */}
      {showCompleteModal && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>Visit Accomplished</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0' }}>"{completingVisit?.school_name}"</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>What did you accomplish? *</label>
                <textarea
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  placeholder="e.g. Met with 30 students, collected 25 contacts..."
                  rows={4}
                  style={{ ...s.input, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={s.label}>Attach Photos (optional)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  {uploadingImages ? 'Uploading...' : '+ Add Photos'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {completionImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {completionImages.map((url, i) => (
                      <img key={i} src={url} alt="upload" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleCompleteSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                Save
              </button>
              <button onClick={() => { setShowCompleteModal(false); setCompletingVisit(null) }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}