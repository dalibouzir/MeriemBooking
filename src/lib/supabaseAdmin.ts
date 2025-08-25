import { createClient } from '@supabase/supabase-js'

// Prefer the server-only URL, but fall back to NEXT_PUBLIC for dev
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

// Server-side client with service role
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 🔍 Debug logging (remove later)
console.log('Supabase URL loaded:', url)
console.log('Service Role key loaded:', serviceKey ? '✔️ yes' : '❌ missing')

// Optional: quick self-test on startup
;(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Supabase test error:', error.message)
    } else {
      console.log('Supabase connected! Sample row:', data)
    }
  } catch (e) {
    console.error('Supabase connection failed:', e)
  }
})()
