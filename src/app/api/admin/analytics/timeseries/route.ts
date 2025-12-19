import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AnalyticsFilters,
  applyClickFilters,
  applyRequestFilters,
  bucketize,
  determineInterval,
  filtersKey,
  getAdminClient,
  matchesDevice,
  parseFilters,
  stripAdvancedFilters,
  withCache,
} from '../shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const forced = req.nextUrl.searchParams.get('interval')
  const interval = determineInterval(filters.from, filters.to, forced)
  const cacheKey = filtersKey('timeseries', filters, { interval })

  try {
    const payload = await withCache(cacheKey, 40, async () => {
      try {
        const [clicks, requests] = await Promise.all([
          clickSeries(supabase, filters, interval || 'day'),
          requestSeries(supabase, filters, interval || 'day'),
        ])
        const merged = mergeSeries(clicks, requests)
        return { interval: interval || 'day', points: merged }
      } catch (err) {
        console.error('timeseries loader fallback', err)
        return { interval: interval || 'day', points: [] }
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('analytics timeseries error', error)
    return NextResponse.json({ error: 'Failed to load timeseries' }, { status: 500 })
  }
}

type SeriesPoint = { bucket: string; count: number }
type Merged = { bucket: string; clicks: number; requests: number }

async function clickSeries(client: SupabaseClient, filters: AnalyticsFilters, interval: 'hour' | 'day'): Promise<SeriesPoint[]> {
  try {
    if (!filters.devices.length) {
      const { data, error } = await applyClickFilters(
        client.from('download_clicks').select(`bucket:date_trunc('${interval}', created_at), count:count()`),
        filters
      )
        .or('meta->>event.eq.click,meta->>event.is.null')
        .group('bucket')
        .order('bucket', { ascending: true })

      if (error) throw error
      return (data || []).map((row: Record<string, unknown>) => ({ bucket: new Date((row as Record<string, unknown>).bucket as string).toISOString(), count: Number((row as Record<string, unknown>).count || 0) }))
    }
  } catch (err) {
    console.warn('clickSeries aggregation failed, using fallback', err)
  }

  try {
    const { data, error } = await applyClickFilters(
      client.from('download_clicks').select('created_at, user_agent, meta'),
      filters
    ).or('meta->>event.eq.click,meta->>event.is.null').limit(10000)

    if (error) throw error
    const filtered = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
    return bucketize(filtered as { created_at: string }[], interval)
  } catch (err) {
    console.warn('clickSeries device fallback', err)
    const stripped = stripAdvancedFilters(filters)
    const { data, error } = await applyClickFilters(
      client.from('download_clicks').select('created_at'),
      stripped
    ).or('meta->>event.eq.click,meta->>event.is.null').limit(10000)
    if (error) throw error
    return bucketize((data || []) as any, interval)
  }
}

async function requestSeries(client: SupabaseClient, filters: AnalyticsFilters, interval: 'hour' | 'day'): Promise<SeriesPoint[]> {
  try {
    if (!filters.devices.length) {
      const { data, error } = await applyRequestFilters(
        client.from('download_requests').select(`bucket:date_trunc('${interval}', created_at), count:count()`),
        filters
      )
        .group('bucket')
        .order('bucket', { ascending: true })

      if (error) throw error
      return (data || []).map((row: Record<string, unknown>) => ({ bucket: new Date((row as Record<string, unknown>).bucket as string).toISOString(), count: Number((row as Record<string, unknown>).count || 0) }))
    }
  } catch (err) {
    console.warn('requestSeries aggregation failed, using fallback', err)
  }

  try {
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('created_at, user_agent'),
      filters
    ).limit(10000)

    if (error) throw error
    const filtered = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
    return bucketize(filtered as { created_at: string }[], interval)
  } catch (err) {
    console.warn('requestSeries device fallback', err)
    const stripped = stripAdvancedFilters(filters)
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('created_at'),
      stripped
    ).limit(10000)
    if (error) throw error
    return bucketize((data || []) as any, interval)
  }
}

function mergeSeries(clicks: SeriesPoint[], requests: SeriesPoint[]): Merged[] {
  const map = new Map<string, { clicks: number; requests: number }>()
  for (const point of clicks || []) {
    map.set(point.bucket, { clicks: point.count, requests: map.get(point.bucket)?.requests || 0 })
  }
  for (const point of requests || []) {
    const existing = map.get(point.bucket) || { clicks: 0, requests: 0 }
    existing.requests = point.count
    map.set(point.bucket, existing)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([bucket, value]) => ({ bucket, clicks: value.clicks || 0, requests: value.requests || 0 }))
}
