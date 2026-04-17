// lib/auth-guard.js
// Call this at the top of every protected API route.
// Returns { user } if authenticated, or returns a 401 NextResponse if not.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function requireAuth() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can throw in read-only contexts (middleware), safe to ignore in route handlers
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, errorResponse: null }
}