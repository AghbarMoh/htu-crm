'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export default function VisitsMap({ visits, completions }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return // already initialized

    const L = require('leaflet')

    // Clear any stale leaflet ID on the container
    delete containerRef.current._leaflet_id

    const map = L.map(containerRef.current).setView([31.9539, 35.9106], 11)
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    }).addTo(map)

    const iconCompleted = L.divIcon({
      className: 'custom-pin',
      iconAnchor: [0, 24],
      popupAnchor: [0, -36],
      html: `<span style="background-color:#10b981;width:24px;height:24px;display:block;left:-12px;top:-12px;position:relative;border-radius:24px 24px 0;transform:rotate(45deg);border:2px solid #ffffff;" />`
    })

    const validVisits = (visits || []).filter(v =>
      v.lat && v.lng && completions && completions[v.id]
    )

    validVisits.forEach(v => {
      L.marker([parseFloat(v.lat), parseFloat(v.lng)], { icon: iconCompleted })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui,sans-serif">
            <strong style="display:block;font-size:13px;margin-bottom:2px">${v.school_name || ''}</strong>
            <span style="font-size:11px;color:#666">${v.visit_date || ''} · ✅ Completed</span>
          </div>
        `)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [visits, completions])

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }}
    />
  )
}