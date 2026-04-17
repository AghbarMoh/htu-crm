// lib/logger.js
// ⚠️  SERVER ONLY — call this only from API routes, never from 'use client' components.
// All dashboard pages now call /api/activity (POST) to log, which calls this server-side.

import { createServiceClient } from './supabase-server'

export async function logActivity(action, entityType, entityName, details) {
  try {
    const supabase = createServiceClient()
    await supabase.from('activity_log').insert([{
      action,
      entity_type: entityType,
      entity_name: entityName,
      details,
    }])
  } catch (err) {
    // Never let logging crash a real operation
    console.error('[logger] Failed to write activity log:', err)
  }
}