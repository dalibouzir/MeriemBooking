import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { code, email } = await req.json()
  if (!code || !email) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  // 1) Find the code (unused) for this email
  const { data: rows, error } = await supabaseAdmin
    .from('gift_tokens')
    .select('*')
    .eq('code', code)
    .eq('email', email)
    .eq('is_used', false)
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or already used code' }, { status: 400 })
  }

  // 2) Mark the code as used
  const id = rows[0].id
  await supabaseAdmin.from('gift_tokens')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', id)

  // 3) Issue a short-lived booking token (URL param)
  // For demo: generate UUID and return (you can store/verify in DB if needed)
  const bookingToken = randomUUID()

  // (Optional) Store bookingToken -> email in a temp table/cache to verify on /free-call
  // For a quick demo we return it directly:
  return NextResponse.json({ token: bookingToken })
}
