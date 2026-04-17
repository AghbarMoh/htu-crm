// app/api/tasks/route.js
// Handles tasks + task_completions operations.

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'
import { logActivity } from '@/lib/logger'

export async function GET() {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const [{ data: tasks, error: te }, { data: completions, error: ce }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('task_completions').select('*'),
  ])

  if (te) return NextResponse.json({ error: te.message }, { status: 500 })
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })
  return NextResponse.json({ tasks, completions })
}

// action: 'insert' | 'update' | 'delete' | 'complete' | 'undo_complete' | 'toggle_done'
export async function POST(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { action, payload } = await req.json()

  if (action === 'insert') {
    const { error } = await supabase.from('tasks').insert([payload])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Created task', 'task', payload.title, 'New task added')
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('tasks').update(rest).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Edited task', 'task', rest.title, 'Task updated')
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    const { id, title } = payload
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Deleted task', 'task', title, 'Task removed')
    return NextResponse.json({ success: true })
  }

  if (action === 'toggle_done') {
    const { id, is_done, title } = payload
    const { error } = await supabase.from('tasks').update({ is_done }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity(is_done ? 'Marked task done' : 'Reopened task', 'task', title, '')
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const { task_id, comment, images, title } = payload
    const { error } = await supabase.from('task_completions').upsert(
      { task_id, comment, images },
      { onConflict: 'task_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Completed task', 'task', title, comment)
    return NextResponse.json({ success: true })
  }

  if (action === 'undo_complete') {
    const { task_id, title } = payload
    const { error } = await supabase.from('task_completions').delete().eq('task_id', task_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity('Undid task completion', 'task', title, 'Moved back to pending')
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}