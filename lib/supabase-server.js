// lib/supabase-server.js
// ⚠️  SERVER ONLY — never import this in 'use client' components
// Uses the service role key which bypasses RLS entirely.
// All API routes use this client.

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables'
    )
  }

  return createClient(url, key, {
    auth: {
      // Service clients must not persist sessions
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}