import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'

  const { data, error } = await supabase
    .from('completed_applicants')
    .select('*')
    .eq('is_archived', archived)
    .order('imported_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}