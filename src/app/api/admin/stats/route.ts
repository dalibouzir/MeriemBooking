import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) { return email === 'meriembouzir05@gmail.com' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabaseAdmin()

  // Reservations per day (last 30)
  const { data: resv, error: rErr } = await supabase.rpc('stats_reservations_last30')
  // Downloads per day (last 30)
  const { data: dls, error: dErr } = await supabase.rpc('stats_downloads_last30')
  // Tokens summary
  const { error: tErr } = await supabase
    .from('call_tokens')
    .select('is_used', { count: 'exact', head: false })
    .limit(1)
  // Supabase returns rows, but we only need counts; run two lightweight counts
  let total = 0, redeemed = 0
  if (!tErr) {
    const { count: cTotal } = await supabase.from('call_tokens').select('*', { count: 'exact', head: true })
    const { count: cUsed } = await supabase.from('call_tokens').select('*', { count: 'exact', head: true }).eq('is_used', true)
    total = cTotal || 0
    redeemed = cUsed || 0
  }

  // If RPCs don’t exist, fallback with empty
  return NextResponse.json({
    reservations: rErr ? [] : resv || [],
    downloads: dErr ? [] : dls || [],
    tokens: { total, redeemed, unredeemed: Math.max(0, total - redeemed) },
  })
}
