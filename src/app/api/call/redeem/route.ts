import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

type CallTokenRow = {
  code: string
  email: string | null
  code_expires_at: string | null
  redeemed_at: string | null
  access_token: string | null
  access_expires_at: string | null
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await req.json().catch(() => ({} as { code?: string }))
    const code = parsed?.code
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    // 1) Fetch code row
    const { data: rowRaw, error } = await supabaseAdmin
      .from('call_tokens')
      .select('*')
      .eq('code', code)
      .single()

    const row = rowRaw as CallTokenRow | null

    if (error || !row) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // 2) Check expiry
    if (row.code_expires_at && new Date(row.code_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }

    // 3) If already redeemed, return existing token if still valid
    if (
      row.redeemed_at &&
      row.access_token &&
      row.access_expires_at &&
      new Date(row.access_expires_at) > new Date()
    ) {
      return NextResponse.json({ ok: true, token: row.access_token, email: row.email })
    }

    // 4) Generate a fresh access token
    const token = crypto.randomBytes(24).toString('hex')
    const accessExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    const redeemedAt = new Date().toISOString()

    const { error: upErr } = await supabaseAdmin
      .from('call_tokens')
      .update({
        redeemed_at: redeemedAt,
        access_token: token,
        access_expires_at: accessExpiresAt,
      })
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
