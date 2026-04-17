// app/api/messaging/route.js
// Handles messages_log reads and writes.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('messages_log')
    .select('*')
    .order('sent_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req) {
  const { errorResponse, user } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { channel, recipients, subject, body } = await req.json()

  const { error } = await supabase.from('messages_log').insert([{
    sent_by: user.id,
    channel,
    recipients,
    subject,
    body,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logActivity('Sent message', 'messaging', subject || channel, `Sent via ${channel}`)
  return NextResponse.json({ success: true })
}