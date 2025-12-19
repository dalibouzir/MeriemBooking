import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/app/api/admin/analytics/shared'

export const dynamic = 'force-dynamic'

type Summary = { requests: number; clicks: number; ratio: number; from: string; to: string }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const { from, to } = parseRange(req.nextUrl.searchParams)

  try {
    const [{ count: reqCount, error: reqErr }, { count: clickCount, error: clickErr }] = await Promise.all([
      supabase
        .from('download_requests')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', from)
        .lte('created_at', to),
      supabase
        .from('download_clicks')
        .select('id', { head: true, count: 'exact' })
        .gte('created_at', from)
        .lte('created_at', to),
    ])

    if (reqErr || clickErr) throw reqErr || clickErr

    const requests = reqCount || 0
    const clicks = clickCount || 0
    const ratio = requests > 0 ? Number(((clicks / requests) * 100).toFixed(2)) : 0
    const payload: Summary = { requests, clicks, ratio, from, to }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('analytics-en summary error', error)
    return NextResponse.json({ requests: 0, clicks: 0, ratio: 0, from, to })
  }
}

function parseRange(params: URLSearchParams) {
  const toRaw = params.get('to')
  const fromRaw = params.get('from')
  const now = new Date()
  const to = toRaw ? new Date(toRaw) : now
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
