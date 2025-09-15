import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'

type FreeBody = { date: string }; // 'YYYY-MM-DD'

function isFreeBody(x: unknown): x is FreeBody {
  return typeof x === "object" && x !== null && typeof (x as Record<string, unknown>).date === "string";
}

// Build ISO strings from date + time (assume UTC to keep deterministic)
function toIso(date: string, time: string) {
  // Expect time like HH:MM:SS or HH:MM
  const t = time.length === 5 ? `${time}:00` : time
  return `${date}T${t}Z`
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!isFreeBody(body)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const { date } = body;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, anon, { auth: { persistSession: false } })

    const { data, error } = await supabase
      .from('free_call_slots_with_remaining')
      .select('id, day, start_time, end_time, remaining, is_open, note')
      .eq('is_open', true)
      .gte('day', date)
      .lte('day', date)
      .order('day', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const free = (data || []).map((r: any) => ({
      id: r.id,
      start: toIso(r.day, r.start_time),
      end: toIso(r.day, r.end_time),
      remaining: Math.max(0, Number(r.remaining ?? 0)),
      note: r.note ?? null,
    }))

    return NextResponse.json({ free })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "server_error";
    if (typeof message === 'string' && message.includes('google_reconnect_required')) {
      return NextResponse.json({ error: 'google_reconnect_required' }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
