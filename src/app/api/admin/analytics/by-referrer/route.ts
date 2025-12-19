import { NextRequest, NextResponse } from 'next/server'
import {
  applyClickFilters,
  stripAdvancedFilters,
  filtersKey,
  getAdminClient,
  matchesDevice,
  parseFilters,
  withCache,
} from '../shared'

export const dynamic = 'force-dynamic'

type RefRow = { referrer: string; clicks: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const limit = Math.max(3, Math.min(20, Number(req.nextUrl.searchParams.get('limit') || 10)))
  const cacheKey = filtersKey('by-referrer', filters, { limit })

  try {
    const items = await withCache(cacheKey, 50, async () => {
      try {
        return await loadReferrers(supabase, filters, limit)
      } catch (err) {
        console.warn('by-referrer fallback without advanced filters', err)
        const stripped = stripAdvancedFilters(filters)
        return await loadReferrers(supabase, stripped, limit)
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics by-referrer error', error)
    return NextResponse.json({ items: [] })
  }
}

async function loadReferrers(supabase: any, filters: ReturnType<typeof parseFilters>, limit: number) {
  if (!filters.devices.length) {
    const { data, error } = await applyClickFilters(
      supabase.from('download_clicks').select('referrer, count:count()', { head: false }),
      filters
    )
      .or('meta->>event.eq.click,meta->>event.is.null')
      .group('referrer')
      .order('count', { ascending: false })

    if (error) throw error
    return (data || [])
      .map((row: Record<string, unknown>) => ({ referrer: normalizeReferrer((row as Record<string, unknown>).referrer as string), clicks: Number((row as Record<string, unknown>).count || 0) }))
      .sort((a: { referrer: string; clicks: number }, b: { referrer: string; clicks: number }) => b.clicks - a.clicks)
      .slice(0, limit)
  }

  const { data, error } = await applyClickFilters(
    supabase.from('download_clicks').select('referrer, user_agent, meta'),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (error) throw error
  const map = new Map<string, number>()
  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = normalizeReferrer((row as any).referrer)
    map.set(key, (map.get(key) || 0) + 1)
  }

  return Array.from(map.entries())
    .map(([referrer, clicks]) => ({ referrer, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit)
}

function normalizeReferrer(value?: string | null) {
  const raw = (value || '').trim()
  if (!raw) return 'غير معروف'
  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://${raw}`)
    return url.hostname.replace(/^www\./, '') || 'غير معروف'
  } catch {
    return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'غير معروف'
  }
}
