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

type SourceRow = { source: string; clicks: number; requests: number; conversionRate: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const cacheKey = filtersKey('by-source', filters)

  try {
    const items = await withCache(cacheKey, 50, async () => buildSources(supabase, filters))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics by-source error', error)
    return NextResponse.json({ items: [] })
  }
}

async function buildSources(client: SupabaseClient, filters: AnalyticsFilters) {
  try {
    const [requestCounts, clickCounts] = await Promise.all([
      requestsBySource(client, filters),
      clicksBySource(client, filters),
    ])
    return mergeSources(requestCounts, clickCounts)
  } catch (err) {
    console.warn('by-source fallback without advanced filters', err)
    const stripped = stripAdvancedFilters(filters)
    const [requestCounts, clickCounts] = await Promise.all([
      requestsBySource(client, stripped),
      clicksBySource(client, stripped),
    ])
    return mergeSources(requestCounts, clickCounts)
  }
}

function mergeSources(requestCounts: Map<string, number>, clickCounts: Map<string, number>): SourceRow[] {
  const sources = new Set<string>([...requestCounts.keys(), ...clickCounts.keys()])
  const rows: SourceRow[] = []

  for (const source of sources) {
    const reqs = requestCounts.get(source) || 0
    const clks = clickCounts.get(source) || 0
    const conversionRate = clks > 0 ? Number((reqs / clks).toFixed(4)) : 0
    rows.push({ source, clicks: clks, requests: reqs, conversionRate })
  }

  return rows.sort((a, b) => b.clicks - a.clicks || b.requests - a.requests)
}

// Removed requestsBySource aggregation by 'source' as the column is no longer present
async function requestsBySource(client: SupabaseClient, filters: AnalyticsFilters) {
  return new Map<string, number>()
}

async function clicksBySource(client: SupabaseClient, filters: AnalyticsFilters) {
  const map = new Map<string, number>()

  if (!filters.devices.length) {
    const { data, error } = await applyClickFilters(
      client.from('download_clicks').select('source, count:count()', { head: false }),
      filters
    )
      .or('meta->>event.eq.click,meta->>event.is.null')
      .group('source')
      .order('count', { ascending: false })

    if (error) throw error
    for (const row of data || []) {
      const key = (row as any).source || 'غير معروف'
      map.set(key, Number((row as any).count || 0))
    }
    return map
  }

  const { data, error } = await applyClickFilters(
    client.from('download_clicks').select('source, user_agent, meta'),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (error) throw error

  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = (row as any).source || 'غير معروف'
    map.set(key, (map.get(key) || 0) + 1)
  }

  return map
}
