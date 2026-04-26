'use client'

import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Download, Info, CheckCircle, Clock, Users, BookOpen, Edit3, Save } from 'lucide-react'

export default function SopMainPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [openProc, setOpenProc] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // 1. The Dynamic State (Editable from the UI)
  const [docData, setDocData] = useState({
    title: "Admission Support Manual",
    code: "ARD-01",
    department: "Admission and Registration Department",
    version: "1.0",
    policies: [
      "The admission process of HTU follows MoHE admissions policies.",
      "The process is digitalized through the HTU portal."
    ],
    procedures: [
      {
        name: "Audit electronic copies of documents",
        responsibility: "Admissions Officer",
        initiator: "Admission section head",
        provision: "HTU policy on admission",
        requirements: "Student has an application in the open semester.",
        checker: "Admission section head",
        retention: "Archived"
      },
      {
        name: "Audit hard copies of documents",
        responsibility: "Admission section head",
        initiator: "Admission section head",
        provision: "HTU policy on admission",
        requirements: "Applicant has passed all initial requirements.",
        checker: "Documents control officer",
        retention: "Archived"
      }
    ]
  })

  const toggleProc = (index) => {
    if (!isEditing) setOpenProc(openProc === index ? null : index)
  }

  // 2. Dynamic PDF Export Logic
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.getElementById('sop-document')
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${docData.code}-${docData.department}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d0d12' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      // Expand all procedures before printing so the PDF isn't hidden
      const previousOpen = openProc
      setOpenProc(null) 
      
      await html2pdf().set(opt).from(element).save()
      
      setOpenProc(previousOpen)
    } catch (error) {
      console.error("PDF Export failed", error)
      alert("Failed to export PDF. Ensure html2pdf.js is installed.")
    } finally {
      setIsExporting(false)
    }
  }

  // Helper function to update procedures array in state
  const updateProcedure = (index, field, value) => {
    const updatedProcedures = [...docData.procedures]
    updatedProcedures[index][field] = value
    setDocData({ ...docData, procedures: updatedProcedures })
  }

  // Helper function to update policies array in state
  const updatePolicy = (index, value) => {
    const updatedPolicies = [...docData.policies]
    updatedPolicies[index] = value
    setDocData({ ...docData, policies: updatedPolicies })
  }

  const s = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
    h2: { fontSize: '16px', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
    p: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' },
    label: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
    value: { fontSize: '13px', color: '#ffffff', fontWeight: '500' },
    input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', width: '100%', outline: 'none' },
    headerInput: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '24px', fontWeight: '700', width: '100%', marginBottom: '8px', outline: 'none' }
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0d0d12', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Controls (Edit & Export) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isEditing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', border: `1px solid ${isEditing ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, color: isEditing ? '#3ecf8e' : '#60a5fa', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          {isEditing ? <><Save size={16} /> Save Changes</> : <><Edit3 size={16} /> Edit Document</>}
        </button>
        <button 
          onClick={handleExportPDF}
          disabled={isEditing || isExporting}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: (isEditing || isExporting) ? 'not-allowed' : 'pointer', opacity: (isEditing || isExporting) ? 0.5 : 1 }}
        >
          <Download size={16} /> {isExporting ? 'Generating...' : 'Export PDF'}
        </button>
      </div>

      {/* The Printable Document Area */}
      <div id="sop-document" style={{ padding: '20px' }}>
        
        {/* Header Area */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#3ecf8e', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>
              ISO 9001:2015
            </div>
            {isEditing ? (
              <input value={docData.code} onChange={(e) => setDocData({...docData, code: e.target.value})} style={{...s.input, width: '100px'}} />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '500' }}>CODE: {docData.code}</div>
            )}
          </div>

          {isEditing ? (
            <>
              <input value={docData.title} onChange={(e) => setDocData({...docData, title: e.target.value})} style={s.headerInput} />
              <input value={docData.department} onChange={(e) => setDocData({...docData, department: e.target.value})} style={s.input} />
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{docData.title}</h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{docData.department} | Version {docData.version}</p>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          
          {/* Left Column: Procedures */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>Standard Operating Procedures</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {docData.procedures.map((proc, index) => (
                <div key={index} style={{ background: (openProc === index || isEditing) ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)', border: (openProc === index || isEditing) ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                  
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleProc(index)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: isEditing ? 'default' : 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <div style={{ background: (openProc === index || isEditing) ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                        {index + 1}
                      </div>
                      {isEditing ? (
                        <input value={proc.name} onChange={(e) => updateProcedure(index, 'name', e.target.value)} style={{...s.input, fontSize: '15px', fontWeight: '600'}} />
                      ) : (
                        <span style={{ fontSize: '15px', fontWeight: '600', color: openProc === index ? '#60a5fa' : '#ffffff' }}>{proc.name}</span>
                      )}
                    </div>
                    {!isEditing && (openProc === index ? <ChevronUp size={18} color="#60a5fa" /> : <ChevronDown size={18} color="rgba(255,255,255,0.3)" />)}
                  </div>

                  {/* Accordion Body (Always open in edit mode) */}
                  {(openProc === index || isEditing) && (
                    <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                        
                        <div>
                          <div style={s.label}>Responsibility</div>
                          {isEditing ? <input value={proc.responsibility} onChange={(e) => updateProcedure(index, 'responsibility', e.target.value)} style={s.input} /> : <div style={s.value}>{proc.responsibility}</div>}
                        </div>
                        
                        <div>
                          <div style={s.label}>Initiator</div>
                          {isEditing ? <input value={proc.initiator} onChange={(e) => updateProcedure(index, 'initiator', e.target.value)} style={s.input} /> : <div style={s.value}>{proc.initiator}</div>}
                        </div>

                        <div>
                          <div style={s.label}>Regulation Provision</div>
                          {isEditing ? <input value={proc.provision} onChange={(e) => updateProcedure(index, 'provision', e.target.value)} style={s.input} /> : <div style={s.value}>{proc.provision}</div>}
                        </div>

                        <div>
                          <div style={s.label}>Start Requirements</div>
                          {isEditing ? <input value={proc.requirements} onChange={(e) => updateProcedure(index, 'requirements', e.target.value)} style={s.input} /> : <div style={s.value}>{proc.requirements}</div>}
                        </div>

                        <div>
                          <div style={s.label}>Checker</div>
                          {isEditing ? <input value={proc.checker} onChange={(e) => updateProcedure(index, 'checker', e.target.value)} style={s.input} /> : <div style={s.value}>{proc.checker}</div>}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Policies */}
          <div>
            <div style={s.card}>
              <h2 style={s.h2}><Info size={18} color="#60a5fa" /> General Policies</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {docData.policies.map((pol, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CheckCircle size={14} color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                    {isEditing ? (
                      <textarea value={pol} onChange={(e) => updatePolicy(i, e.target.value)} style={{...s.input, minHeight: '60px'}} />
                    ) : (
                      <div style={s.p}>{pol}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}