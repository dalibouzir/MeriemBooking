import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AnalyticsFilters,
  applyRequestFilters,
  filtersKey,
  getAdminClient,
  matchesDevice,
  parseFilters,
  stripAdvancedFilters,
  withCache,
} from '../shared'

export const dynamic = 'force-dynamic'

type CountryRow = { country: string; requests: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const cacheKey = filtersKey('by-country', filters)

  try {
    const items = await withCache(cacheKey, 50, async () => buildCountries(supabase, filters))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics by-country error', error)
    return NextResponse.json({ items: [] })
  }
}

async function buildCountries(client: SupabaseClient, filters: AnalyticsFilters) {
  try {
    const map = await requestsByCountry(client, filters)
    return mapToRows(map)
  } catch (err) {
    console.warn('by-country fallback without advanced filters', err)
    const stripped = stripAdvancedFilters(filters)
    const map = await requestsByCountry(client, stripped)
    return mapToRows(map)
  }
}

function mapToRows(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([country, requests]) => ({ country, requests }))
    .sort((a, b) => b.requests - a.requests)
}

async function requestsByCountry(client: SupabaseClient, filters: AnalyticsFilters) {
  const map = new Map<string, number>()

  if (!filters.devices.length) {
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('country, count:count()', { head: false }),
      filters
    )
      .group('country')
      .order('count', { ascending: false })

    if (error) throw error

    for (const row of data || []) {
      const key = normalizeCountry((row as any).country)
      map.set(key, Number((row as any).count || 0))
    }
    return map
  }

  const { data, error } = await applyRequestFilters(
    client.from('download_requests').select('country, user_agent'),
    filters
  )
  if (error) throw error

  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = normalizeCountry((row as any).country)
    map.set(key, (map.get(key) || 0) + 1)
  }

  return map
}

function normalizeCountry(raw?: string | null) {
  const val = (raw || '').trim()
  return val || 'غير معروف'
}
