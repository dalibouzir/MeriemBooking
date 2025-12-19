import { NextRequest, NextResponse } from 'next/server'
import { applyClickFilters, classifyDevice, filtersKey, getAdminClient, parseFilters, withCache } from '../shared'

export const dynamic = 'force-dynamic'

type DeviceRow = { device: string; clicks: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const cacheKey = filtersKey('by-device', filters)

  try {
    const items = await withCache(cacheKey, 50, async () => {
      const { data, error } = await applyClickFilters(
        supabase.from('download_clicks').select('user_agent, meta'),
        filters
      ).or('meta->>event.eq.click,meta->>event.is.null')

      if (error) throw error
      const counts = new Map<string, number>()
      for (const row of data || []) {
        const bucket = classifyDevice((row as any).user_agent)
        if (filters.devices.length && !filters.devices.includes(bucket)) continue
        counts.set(bucket, (counts.get(bucket) || 0) + 1)
      }

      return Array.from(counts.entries())
        .map(([device, clicks]) => ({ device, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics by-device error', error)
    return NextResponse.json({ items: [] })
  }
}
