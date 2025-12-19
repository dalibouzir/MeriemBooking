import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AnalyticsFilters,
  applyClickFilters,
  applyRequestFilters,
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
  const prevRange = previousRange(filters)
  const cacheKey = filtersKey('summary', filters)

  try {
    const payload = await withCache(cacheKey, 45, async () => {
      let current: Snapshot | null = null
      let previous: Snapshot | null = null
      try {
        current = await computeSnapshot(supabase, filters)
        previous = await computeSnapshot(supabase, prevRange)
      } catch (err) {
        console.warn('summary fallback without advanced filters', err)
        const stripped = stripAdvancedFilters(filters)
        const strippedPrev = stripAdvancedFilters(prevRange)
        current = await computeSnapshot(supabase, stripped)
        previous = await computeSnapshot(supabase, strippedPrev)
      }

      return {
        range: { from: filters.from, to: filters.to, previousFrom: prevRange.from, previousTo: prevRange.to },
        totals: current!,
        deltas: {
          clicks: delta(current!.clicks, previous!.clicks),
          requests: delta(current!.requests, previous!.requests),
          conversionRate: delta(current!.conversionRate, previous!.conversionRate),
          uniqueEmails: delta(current!.uniqueEmails, previous!.uniqueEmails),
        },
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('analytics summary error', error)
    return NextResponse.json({
      range: { from: filters.from, to: filters.to },
      totals: { clicks: 0, requests: 0, conversionRate: 0, uniqueEmails: 0, topProduct: null, topSource: null },
      deltas: { clicks: null, requests: null, conversionRate: null, uniqueEmails: null },
    })
  }
}

type Leader = { name: string; count: number } | null
type Snapshot = {
  clicks: number
  requests: number
  conversionRate: number
  uniqueEmails: number
  topProduct: Leader
  topSource: Leader
}

async function computeSnapshot(client: SupabaseClient, filters: AnalyticsFilters): Promise<Snapshot> {
  const [clicks, requests, uniqueEmails] = await Promise.all([
    countClicks(client, filters),
    countRequests(client, filters),
    countUniqueEmails(client, filters),
  ])

  const [topProduct, topSource] = await Promise.all([
    topProductByRequests(client, filters),
    topSourceByClicks(client, filters),
  ])

  const conversionRate = clicks > 0 ? Number((requests / clicks).toFixed(4)) : 0

  return { clicks, requests, conversionRate, uniqueEmails, topProduct, topSource }
}

async function countClicks(client: SupabaseClient, filters: AnalyticsFilters): Promise<number> {
  if (!filters.devices.length) {
    const { count, error } = await applyClickFilters(
      client.from('download_clicks').select('id', { head: true, count: 'exact' }),
      filters
    ).or('meta->>event.eq.click,meta->>event.is.null')

    if (error) throw error
    return count || 0
  }

  const { data, error } = await applyClickFilters(
    client.from('download_clicks').select('id, user_agent, meta'),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (error) throw error
  return (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices)).length
}

async function countRequests(client: SupabaseClient, filters: AnalyticsFilters): Promise<number> {
  if (!filters.devices.length) {
    const { count, error } = await applyRequestFilters(
      client.from('download_requests').select('id', { head: true, count: 'exact' }),
      filters
    )

    if (error) throw error
    return count || 0
  }

  const { data, error } = await applyRequestFilters(
    client.from('download_requests').select('id, user_agent'),
    filters
  )

  if (error) throw error
  return (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices)).length
}

async function countUniqueEmails(client: SupabaseClient, filters: AnalyticsFilters): Promise<number> {
  try {
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('count:count(distinct email)'),
      filters
    ).single()

    if (error) throw error
    const value = (data as any)?.count
    if (typeof value === 'number') return value
  } catch (err) {
    console.warn('unique email distinct count fallback', err)
  }

  const { data, error } = await applyRequestFilters(
    client.from('download_requests').select('email, user_agent'),
    filters
  )
  if (error) throw error

  const seen = new Set<string>()
  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const email = ((row as any).email || '').trim().toLowerCase()
    if (email) seen.add(email)
  }
  return seen.size
}

async function topProductByRequests(client: SupabaseClient, filters: AnalyticsFilters): Promise<Leader> {
  if (!filters.devices.length) {
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('product_slug, count:count()', { head: false }),
      filters
    )
      .group('product_slug')
      .order('count', { ascending: false })
      .limit(1)

    if (error) throw error
    const row = (data || [])[0]
    if (!row) return null
    const name = (row as any).product_slug || 'غير معروف'
    return { name, count: Number((row as any).count || 0) }
  }

  const { data, error } = await applyRequestFilters(
    client.from('download_requests').select('product_slug, user_agent'),
    filters
  )
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = (row as any).product_slug || 'غير معروف'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  let top: Leader = null
  for (const [name, count] of counts.entries()) {
    if (!top || count > top.count) top = { name, count }
  }
  return top
}

async function topSourceByClicks(client: SupabaseClient, filters: AnalyticsFilters): Promise<Leader> {
  if (!filters.devices.length) {
    const { data, error } = await applyClickFilters(
      client.from('download_clicks').select('source, count:count()', { head: false }),
      filters
    )
      .or('meta->>event.eq.click,meta->>event.is.null')
      .group('source')
      .order('count', { ascending: false })
      .limit(1)

    if (error) throw error
    const row = (data || [])[0]
    if (!row) return null
    const name = (row as any).source || 'غير معروف'
    return { name, count: Number((row as any).count || 0) }
  }

  const { data, error } = await applyClickFilters(
    client.from('download_clicks').select('source, user_agent, meta'),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = (row as any).source || 'غير معروف'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  let top: Leader = null
  for (const [name, count] of counts.entries()) {
    if (!top || count > top.count) top = { name, count }
  }
  return top
}

function previousRange(filters: AnalyticsFilters): AnalyticsFilters {
  const fromMs = Date.parse(filters.from)
  const toMs = Date.parse(filters.to)
  const span = Math.max(60 * 60 * 1000, toMs - fromMs)
  const prevTo = new Date(fromMs)
  const prevFrom = new Date(fromMs - span)
  return { ...filters, from: prevFrom.toISOString(), to: prevTo.toISOString() }
}

function delta(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  const diff = current - previous
  return Number(((diff / previous) * 100).toFixed(2))
}
