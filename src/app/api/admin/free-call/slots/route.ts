import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) {
  return email === 'meriembouzir05@gmail.com'
}

function toTunisiaISO(day: string, time: string) {
  const t = time.length === 5 ? `${time}:00` : time
  // Tunisia (Africa/Tunis) uses UTC+1 (no DST currently)
  return `${day}T${t}+01:00`
}

function isPastInTunisia(day: string, time: string) {
  const iso = toTunisiaISO(day, time)
  const dt = Date.parse(iso)
  if (Number.isNaN(dt)) return false
  return dt < Date.now()
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // YYYY-MM-DD
  const to = searchParams.get('to') // YYYY-MM-DD

  const supabase = getSupabaseAdmin()
  let q = supabase
    .from('free_call_slots_with_remaining')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (from) q = q.gte('day', from)
  if (to) q = q.lte('day', to)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slots: data })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { day, start_time, end_time, capacity = 1, is_open = true, note = null } = body as Record<string, unknown>
  if (typeof day !== 'string' || typeof start_time !== 'string' || typeof end_time !== 'string') {
    return NextResponse.json({ error: 'day, start_time, end_time are required' }, { status: 400 })
  }
  if (typeof capacity !== 'number' || capacity <= 0) {
    return NextResponse.json({ error: 'capacity must be > 0' }, { status: 400 })
  }

  // Auto-skip creating past slots (Africa/Tunis local time)
  if (isPastInTunisia(day, start_time)) {
    return NextResponse.json({ skipped: true, reason: 'start_time_already_passed_tunisia' }, { status: 200 })
  }

  // Upsert on unique (day,start_time,end_time)
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('free_call_slots')
    .upsert({ day, start_time, end_time, capacity, is_open, note }, { onConflict: 'day,start_time,end_time' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  const { id, ...rest } = body as Record<string, unknown>

  const update: Record<string, unknown> = {}
  if (typeof rest.day === 'string') update.day = rest.day
  if (typeof rest.start_time === 'string') update.start_time = rest.start_time
  if (typeof rest.end_time === 'string') update.end_time = rest.end_time
  if (typeof rest.capacity === 'number') update.capacity = rest.capacity
  if (typeof rest.is_open === 'boolean') update.is_open = rest.is_open
  if (typeof rest.note === 'string' || rest.note === null) update.note = rest.note

  // If the resulting start time is in the past (Tunisia), delete the slot instead
  if (typeof update.day === 'string' && typeof update.start_time === 'string') {
    if (isPastInTunisia(update.day as string, update.start_time as string)) {
      const supabaseDel = getSupabaseAdmin()
      const { error: delErr } = await supabaseDel.from('free_call_slots').delete().eq('id', id)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
      return NextResponse.json({ deleted: true })
    }
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('free_call_slots')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('free_call_slots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
