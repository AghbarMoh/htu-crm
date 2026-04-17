'use client'

import { useState, useEffect } from 'react'
import { Search, Trash2 } from 'lucide-react'

export default function ActivityPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  

  useEffect(() => { fetchActivities() }, [])

  // 1. Fetching through the Backend Proxy
  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activity')
      const json = await res.json()
      if (json.data) setActivities(json.data)
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  // 2. Deleting one item through the Proxy
  const handleDeleteOne = async (id) => {
    if (!confirm('Delete this activity?')) return
    await fetch(`/api/activity?id=${id}`, { method: 'DELETE' })
    fetchActivities()
  }

  // 3. Deleting all items through the Proxy
  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL activity logs?')) return
    await fetch('/api/activity?all=true', { method: 'DELETE' })
    fetchActivities()
  }

  const entityTypes = [...new Set(activities.map(a => a.entity_type).filter(Boolean))]

  const filtered = activities.filter(a => {
    const matchSearch = !search ||
      a.action?.toLowerCase().includes(search.toLowerCase()) ||
      a.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.details?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || a.entity_type === filterType
    return matchSearch && matchType
  })

  const getEntityColor = (type) => {
    const colors = {
      applicant: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
      school_visit: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
      contact: { bg: 'rgba(236,72,153,0.15)', color: '#f472b6' },
      task: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
      messaging: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
      archive: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    }
    return colors[type] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
  }

  const getActionIcon = (action) => {
    if (action?.includes('Added') || action?.includes('Imported')) return '+'
    if (action?.includes('Edited')) return '✎'
    if (action?.includes('Deleted')) return '×'
    if (action?.includes('Completed') || action?.includes('Archived')) return '✓'
    if (action?.includes('Sent')) return '→'
    return '•'
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return minutes + 'm ago'
    if (hours < 24) return hours + 'h ago'
    if (days < 7) return days + 'd ago'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const s = {
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ffffff', outline: 'none', boxSizing: 'border-box' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Activity Log</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Track all actions performed in the system</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchActivities} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            Refresh
          </button>
          <button onClick={handleDeleteAll} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', color: '#ef4444', cursor: 'pointer' }}>
            Delete All
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." style={{ ...s.input, paddingLeft: '36px' }} />
        </div>
        <button onClick={() => setFilterType('all')} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterType === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
          All
        </button>
        {entityTypes.map(type => (
          <button key={type} onClick={() => setFilterType(type)} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', background: filterType === type ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: filterType === type ? '#3b82f6' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
            {type.replace('_', ' ')}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>{filtered.length} activities</span>
      </div>

      {/* Activity List */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)' }}>No activities found</div>
        ) : (
          filtered.map((activity, index) => {
            const entityColor = getEntityColor(activity.entity_type)
            return (
              <div key={activity.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 20px',
                borderBottom: index < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: entityColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: entityColor.color, fontWeight: '700',
                }}>
                  {getActionIcon(activity.action)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', margin: 0 }}>{activity.action}</p>
                    {activity.entity_type && (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: entityColor.bg, color: entityColor.color, textTransform: 'capitalize' }}>
                        {activity.entity_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {activity.entity_name && (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px 0' }}>{activity.entity_name}</p>
                  )}
                  {activity.details && (
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{activity.details}</p>
                  )}
                </div>

                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                    {formatTime(activity.created_at)}
                  </span>
                  <button onClick={() => handleDeleteOne(activity.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '2px', display: 'flex' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}