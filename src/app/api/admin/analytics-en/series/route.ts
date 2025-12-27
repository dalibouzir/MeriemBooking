import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/app/api/admin/analytics/shared'

export const dynamic = 'force-dynamic'

type SeriesPoint = { date: string; requests: number; clicks: number }

type BucketRow = { bucket: string; count: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const { from, to } = parseRange(req.nextUrl.searchParams)

  try {
    const [reqRows, clickRows] = await Promise.all([
      loadAgg(supabase, 'download_requests', from, to),
      loadAgg(supabase, 'download_clicks', from, to),
    ])

    const points = mergeSeries(reqRows, clickRows, from, to)
    return NextResponse.json({ from, to, points })
  } catch (error) {
    console.error('analytics-en series error', error)
    return NextResponse.json({ from, to, points: [] })
  }
}

async function loadAgg(client: any, table: string, from: string, to: string): Promise<BucketRow[]> {
  const baseQuery = client
    .from(table)
    .select("bucket:date_trunc('day', created_at), count:count()")
    .gte('created_at', from)
    .lte('created_at', to)

  if (typeof baseQuery.group === 'function') {
    try {
      const { data, error } = await baseQuery.group('bucket').order('bucket', { ascending: true })
      if (error) throw error
      return (data || []).map((row: any) => ({ bucket: row.bucket, count: Number(row.count || 0) }))
    } catch (err) {
      console.warn(`${table} agg failed, fallback to client bucket`, err)
    }
  }

  const { data, error } = await client
    .from(table)
    .select('created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .limit(10000)
  if (error) throw error
  const map = new Map<string, number>()
  for (const row of data || []) {
    const bucket = normalizeDay(row.created_at)
    map.set(bucket, (map.get(bucket) || 0) + 1)
  }
  return Array.from(map.entries()).map(([bucket, count]) => ({ bucket, count }))
}

function mergeSeries(reqRows: BucketRow[], clickRows: BucketRow[], from: string, to: string): SeriesPoint[] {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const map = new Map<string, { requests: number; clicks: number }>()
  for (const r of reqRows || []) {
    const day = normalizeDay(r.bucket)
    map.set(day, { requests: r.count, clicks: map.get(day)?.clicks || 0 })
  }
  for (const c of clickRows || []) {
    const day = normalizeDay(c.bucket)
    const prev = map.get(day) || { requests: 0, clicks: 0 }
    map.set(day, { ...prev, clicks: c.count })
  }

  const points: SeriesPoint[] = []
  let cursor = startOfDay(fromDate)
  const end = startOfDay(toDate)
  while (cursor <= end) {
    const key = normalizeDay(cursor.toISOString())
    const value = map.get(key) || { requests: 0, clicks: 0 }
    points.push({ date: key, requests: value.requests, clicks: value.clicks })
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return points
}

function normalizeDay(input: string) {
  const d = new Date(input)
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseRange(params: URLSearchParams) {
  const toRaw = params.get('to')
  const fromRaw = params.get('from')
  const now = new Date()
  const to = toRaw ? new Date(toRaw) : now
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
