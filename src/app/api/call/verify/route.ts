// src/app/api/call/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: row, error } = await supabase
    .from('call_tokens')
    .select('email, access_expires_at, redeemed_at')
    .eq('access_token', token)
    .single()

  if (error || !row) return NextResponse.json({ valid: false }, { status: 401 })

  if (!row.redeemed_at || !row.access_expires_at || new Date(row.access_expires_at) < new Date()) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({ valid: true, email: row.email, expiresAt: row.access_expires_at })
}
