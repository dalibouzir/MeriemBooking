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

type ProductRow = { product: string; clicks: number; requests: number; conversionRate: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const cacheKey = filtersKey('by-product', filters)

  try {
    const items = await withCache(cacheKey, 50, async () => buildProducts(supabase, filters))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics by-product error', error)
    // Soft-fail with empty data so UI stays functional
    return NextResponse.json({ items: [] })
  }
}

async function buildProducts(client: SupabaseClient, filters: AnalyticsFilters) {
  try {
    const [requestCounts, clickCounts] = await Promise.all([
      requestsByProduct(client, filters),
      clicksByProduct(client, filters),
    ])

    return mergeProducts(requestCounts, clickCounts)
  } catch (err) {
    console.warn('by-product fallback without advanced filters', err)
    const stripped = stripAdvancedFilters(filters)
    const [requestCounts, clickCounts] = await Promise.all([
      requestsByProduct(client, stripped),
      clicksByProduct(client, stripped),
    ])
    return mergeProducts(requestCounts, clickCounts)
  }
}

function mergeProducts(requestCounts: Map<string, number>, clickCounts: Map<string, number>): ProductRow[] {
  const products = new Set<string>([...requestCounts.keys(), ...clickCounts.keys()])
  const rows: ProductRow[] = []

  for (const product of products) {
    const reqs = requestCounts.get(product) || 0
    const clks = clickCounts.get(product) || 0
    const conversionRate = clks > 0 ? Number((reqs / clks).toFixed(4)) : 0
    rows.push({ product, clicks: clks, requests: reqs, conversionRate })
  }

  return rows.sort((a, b) => b.requests - a.requests || b.clicks - a.clicks)
}

async function requestsByProduct(client: SupabaseClient, filters: AnalyticsFilters) {
  const map = new Map<string, number>()

  if (!filters.devices.length) {
    const { data, error } = await applyRequestFilters(
      client.from('download_requests').select('product_slug, count:count()', { head: false }),
      filters
    )
      .group('product_slug')
      .order('count', { ascending: false })

    if (error) throw error
    for (const row of data || []) {
      const key = (row as any).product_slug || 'غير معروف'
      map.set(key, Number((row as any).count || 0))
    }
    return map
  }

  const { data, error } = await applyRequestFilters(
    client.from('download_requests').select('product_slug, user_agent'),
    filters
  )
  if (error) throw error

  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = (row as any).product_slug || 'غير معروف'
    map.set(key, (map.get(key) || 0) + 1)
  }

  return map
}

async function clicksByProduct(client: SupabaseClient, filters: AnalyticsFilters) {
  const map = new Map<string, number>()

  if (!filters.devices.length) {
    const { data, error } = await applyClickFilters(
      client.from('download_clicks').select('product_slug, count:count()', { head: false }),
      filters
    )
      .or('meta->>event.eq.click,meta->>event.is.null')
      .group('product_slug')
      .order('count', { ascending: false })

    if (error) throw error
    for (const row of data || []) {
      const key = (row as any).product_slug || 'غير معروف'
      map.set(key, Number((row as any).count || 0))
    }
    return map
  }

  const { data, error } = await applyClickFilters(
    client.from('download_clicks').select('product_slug, user_agent, meta'),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (error) throw error

  for (const row of data || []) {
    if (!matchesDevice((row as any).user_agent, filters.devices)) continue
    const key = (row as any).product_slug || 'غير معروف'
    map.set(key, (map.get(key) || 0) + 1)
  }

  return map
}
