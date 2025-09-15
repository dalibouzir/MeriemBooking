import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const from = url.searchParams.get('from') // YYYY-MM-DD
    const to = url.searchParams.get('to') // YYYY-MM-DD
    if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 })

    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supaUrl, anon, { auth: { persistSession: false } })

    const { data, error } = await supabase
      .from('free_call_slots_with_remaining')
      .select('day, remaining, is_open')
      .eq('is_open', true)
      .gt('remaining', 0)
      .gte('day', from)
      .lte('day', to)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    type Row = { day: string }
    const rows = (data || []) as Row[]
    const days = Array.from(new Set(rows.map((r) => r.day))).sort()
    return NextResponse.json({ days })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
