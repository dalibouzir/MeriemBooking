import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CallTokenRow = {
  code: string
  email: string | null
  code_expires_at: string | null
  redeemed_at: string | null
  access_token: string | null
  access_expires_at: string | null
  expires_at?: string | null
  is_used?: boolean | null
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await req.json().catch(() => ({} as { code?: string }))
    const code = parsed?.code
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    // 1) Fetch code row
    const supabase = getSupabaseAdmin()
    const { data: rowRaw, error } = await supabase
      .from('call_tokens')
      .select('*')
      .eq('code', code)
      .single()

    const row = rowRaw as CallTokenRow | null

    if (error || !row) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // 2) Check expiry (support both code_expires_at or expires_at)
    const expiresAt = row.code_expires_at || row.expires_at || null
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }

    // 3) Disallow reuse: if already redeemed/used once, block
    const alreadyUsed = Boolean(row.is_used) || Boolean(row.redeemed_at)
    if (alreadyUsed) {
      return NextResponse.json({ error: 'Code already redeemed' }, { status: 400 })
    }

    // 4) Generate a fresh access token
    const token = crypto.randomBytes(24).toString('hex')
    const accessExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    const redeemedAt = new Date().toISOString()

    const update: Record<string, unknown> = {
      redeemed_at: redeemedAt,
      access_token: token,
      access_expires_at: accessExpiresAt,
      is_used: true,
      used_at: redeemedAt,
    }
    const { error: upErr } = await supabase
      .from('call_tokens')
      .update(update)
      .eq('code', code)

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, token, email: row.email })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    )
  }
}
