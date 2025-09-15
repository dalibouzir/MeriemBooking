import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) {
  return email === 'meriembouzir05@gmail.com'
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slotId = searchParams.get('slot_id')
  const day = searchParams.get('day') // YYYY-MM-DD

  const supabase = getSupabaseAdmin()
  let q = supabase
    .from('free_call_reservations')
    .select('id, slot_id, user_id, email, status, created_at, free_call_slots ( day, start_time, end_time )')
    .order('created_at', { ascending: false })

  if (slotId) q = q.eq('slot_id', slotId)
  if (day) q = q.eq('free_call_slots.day', day)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservations: data })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('free_call_reservations')
    .update({ status: 'cancelled' })
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservation: data })
}

