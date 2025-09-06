import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazily create server-side client with service role to avoid throwing at import time
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE

  if (!url) {
    throw new Error(
      'Missing Supabase URL: set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in .env.local'
    )
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE in .env.local (server-only)')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
