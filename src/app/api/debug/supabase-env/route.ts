import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE
  return NextResponse.json({
    supabaseUrlPrefix: url ? url.slice(0, 30) : 'missing',
    hasAnon: !!anon,
    hasServiceRole: !!service,
  })
}

