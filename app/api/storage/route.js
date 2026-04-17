// app/api/storage/route.js
// Proxies file uploads to Supabase Storage using the service key.
// The browser sends the file here; this route uploads it and returns the public URL.
// Replaces direct supabase.storage calls from 'use client' components.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()

  const formData = await req.formData()
  const file = formData.get('file')
  const bucket = formData.get('bucket') || 'task-images'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const fileName = `${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}