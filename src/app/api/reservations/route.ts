import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { createCalendarEvent } from '@/lib/google-server'

function getSupabaseFromAuthHeader(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const token = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = token
  return createClient(url, anon, { auth: { persistSession: false }, global: { headers } })
}

// With email-only reservations, we no longer require a real auth user.
// user_id may be nullable in DB (see provided SQL). If not, set to a single guest id.
async function getUserIdForInsert(): Promise<string | null> {
  const guestId = process.env.SUPABASE_GUEST_USER_ID
  return guestId || null
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.slot_id !== 'string' || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'slot_id and email are required' }, { status: 400 })
  }
  const email = String(body.email).trim()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

  const supabase = getSupabaseAdmin()

  // 1) Read slot to build calendar times
  const { data: slot, error: slotErr } = await supabase
    .from('free_call_slots')
    .select('id, day, start_time, end_time')
    .eq('id', body.slot_id)
    .single()
  if (slotErr || !slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

  const toIso = (d: string, t: string) => {
    const hhmm = t.length === 5 ? `${t}:00` : t
    // Treat as local time Africa/Tunis if your google-server handles TZ; otherwise UTC Z
    return `${d}T${hhmm}:00Z`.replace(':00:00Z', ':00Z')
  }
  const startISO = toIso(slot.day as string, slot.start_time as string)
  const endISO = toIso(slot.day as string, slot.end_time as string)

  // 2) Insert reservation (email-only)
  const userId = await getUserIdForInsert() // may be null
  const { data: inserted, error } = await supabase
    .from('free_call_reservations')
    .insert({ slot_id: body.slot_id, user_id: userId, email, status: 'confirmed' })
    .select('*')
    .single()

  if (error) {
    const code = (error as any).code || ''
    const msg = (error as any).message || ''
    const isDuplicate = code === '23505' || /duplicate/i.test(msg)
    const isFull = /capacity|full|no remaining|no remaining capacity/i.test(msg)
    return NextResponse.json({ error: isFull ? 'No remaining capacity' : (isDuplicate ? 'Already reserved' : msg) }, { status: isFull ? 409 : (isDuplicate ? 409 : 500) })
  }

  // 3) Create Google Calendar event
  const ev = await createCalendarEvent({
    startISO,
    endISO,
    clientEmail: email,
    clientName: name || undefined,
    subject: 'Free Call',
    notes,
  })
  const meet = (ev as any)?.hangoutLink || (ev as any)?.htmlLink || null

  // 4) Send confirmation email via Resend if configured
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Meriem <noreply@fittrahmoms.com>'
  if (RESEND_API_KEY) {
    const html = `
      <div style="font-family:Arial,system-ui;direction:rtl;text-align:right">
        <h2>تأكيد موعد المكالمة</h2>
        <p>تم حجز الموعد بنجاح.</p>
        <p><b>التاريخ:</b> ${slot.day} — <b>الوقت:</b> ${slot.start_time}–${slot.end_time}</p>
        ${meet ? `<p><a href="${meet}">رابط اللقاء</a></p>` : ''}
        ${notes ? `<p><b>ملاحظاتك:</b> ${notes}</p>` : ''}
        <p>مع التحية، فريق مريم</p>
      </div>
    `.trim()
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [email], subject: 'تأكيد مكالمة مجانية', html }),
      })
    } catch {}
  }

  return NextResponse.json({ reservation: inserted, meet })
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string' || typeof body.email !== 'string') return NextResponse.json({ error: 'id and email required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('free_call_reservations')
    .update({ status: 'cancelled' })
    .eq('id', body.id)
    .eq('email', body.email)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservation: data })
}
