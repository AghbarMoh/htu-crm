'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Mail, Phone, FileText } from 'lucide-react'


export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [filterRole, setFilterRole] = useState('all')
  const [customRole, setCustomRole] = useState('') // <-- ADD THIS
  

  const roles = ['Counselor', 'Manager', 'Ministry', 'Other']
  const emptyForm = { full_name: '', role: 'Counselor', school_name: '', email: '', phone: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchContacts() }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/contacts')
      const json = await res.json()
      if (json.data) setContacts(json.data)
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.full_name) { alert('Please fill in contact name'); return }
    
    const action = editingContact ? 'update' : 'insert'
    const finalRole = form.role === 'Other' ? customRole : form.role
    const payload = editingContact 
      ? { ...form, role: finalRole, id: editingContact.id } 
      : { ...form, role: finalRole }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      })
      const json = await res.json()
      
      if (json.success) {
        fetchContacts()
        setShowForm(false)
        setEditingContact(null)
        setForm(emptyForm)
      } else {
        alert('Error saving contact: ' + json.error)
      }
    } catch (error) {
      console.error("Failed to save contact:", error)
    }
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    setForm({ full_name: contact.full_name || '', role: contact.role || 'Counselor', school_name: contact.school_name || '', email: contact.email || '', phone: contact.phone || '', notes: contact.notes || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    const contact = contacts.find(c => c.id === id)
    
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', payload: { id, full_name: contact?.full_name } })
      })
      const json = await res.json()
      
      if (json.success) {
        fetchContacts()
      } else {
        alert("Failed to delete contact: " + json.error)
      }
    } catch (error) {
      console.error("Failed to delete contact:", error)
    }
  }
  const generateWord = async () => {
    alert('Generating Word Document...');
    const { 
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
      WidthType, HeadingLevel, AlignmentType 
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    const tableHeader = new TableRow({
      children: ['Full Name', 'Role', 'School', 'Email', 'Phone', 'Notes'].map(
        text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
          background: { fill: "f3f4f6" }
        })
      ),
    });

    const dataRows = filteredContacts.map(c => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(c.full_name || '-')] }),
        new TableCell({ children: [new Paragraph(c.role || '-')] }),
        new TableCell({ children: [new Paragraph(c.school_name || '-')] }),
        new TableCell({ children: [new Paragraph(c.email || '-')] }),
        new TableCell({ children: [new Paragraph(c.phone || '-')] }),
        new TableCell({ children: [new Paragraph(c.notes || '-')] }),
      ]
    }));

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "HTU CRM - Contacts Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeader, ...dataRows],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `HTU_Contacts_${new Date().toISOString().split('T')[0]}.docx`);
    await logActivity('Exported Word Doc', 'contact', 'All Contacts', 'Contacts list exported to Word');
  };

  const filteredContacts = filterRole === 'all' ? contacts : contacts.filter(c => c.role === filterRole)

  const s = {
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    td: { padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    input: { width: '100%', backgroundColor: '#1a1a2e', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Contacts</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Counselors, managers and important people</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={generateWord} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#f59e0b', cursor: 'pointer' }}
          >
            <FileText size={16} />
            Export Word
          </button>
          <button onClick={() => { setShowForm(true); setEditingContact(null); setForm(emptyForm) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {['all', ...roles].map(role => (
          <button key={role} onClick={() => setFilterRole(role)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer',
            background: filterRole === role ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            color: filterRole === role ? '#3b82f6' : 'rgba(255,255,255,0.4)',
          }}>
            {role === 'all' ? 'All' : role}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: '8px' }}>{filteredContacts.length} contacts</span>
      </div>

      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
  <tr>
    {['#', 'Full Name', 'Role', 'School', 'Email', 'Phone', 'Notes', 'Actions'].map(h => (
      <th key={h} style={s.th}>{h}</th>
    ))}
  </tr>
</thead>
<tbody>
  {loading ? (
    <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>Loading...</td></tr>
  ) : filteredContacts.length === 0 ? (
    <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>No contacts found</td></tr>
  ) : (
              filteredContacts.map((contact, i) => (
  <tr key={contact.id}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <td style={{ ...s.td, width: '40px', color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
    <td style={{ ...s.td, color: '#ffffff', fontWeight: '500' }}>{contact.full_name}</td>
                  <td style={s.td}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                      {contact.role}
                    </span>
                  </td>
                  <td style={s.td}>{contact.school_name || '-'}</td>
                  <td style={s.td}>
                    {contact.email ? (
                      <a href={"mailto:" + contact.email} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', textDecoration: 'none', fontSize: '13px' }}>
                        <Mail size={13} />
                        {contact.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={s.td}>
                    {contact.phone ? (
                      <a href={"https://wa.me/" + contact.phone.replace(/\D/g, '')} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', textDecoration: 'none', fontSize: '13px' }}>
                        <Phone size={13} />
                        {contact.phone}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ ...s.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.notes || '-'}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(contact)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(contact.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', display: 'flex' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: '0 0 20px 0' }}>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Ahmad Al-Hassan" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={s.input}>
  {roles.map(r => (
    <option key={r} value={r} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
      {r}
    </option>
  ))}
</select>
              </div>

              {form.role === 'Other' && (
                <div style={{ marginTop: '8px' }}>
                  <label style={s.label}>Specify Role *</label>
                  <input 
                    type="text" 
                    value={customRole} 
                    onChange={(e) => setCustomRole(e.target.value)} 
                    placeholder="e.g. Graphic Designer" 
                    style={s.input} 
                  />
                </div>
              )}
              <div>
                <label style={s.label}>School Name</label>
                <input type="text" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} placeholder="e.g. Al-Ahliyya School" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. contact@school.edu.jo" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0791234567" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: '#ffffff', cursor: 'pointer' }}>
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingContact(null); setCustomRole('') }} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}