import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/app/api/admin/analytics/shared'

export const dynamic = 'force-dynamic'

type DeviceRow = { device: string; count: number }

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const { from, to } = parseRange(req.nextUrl.searchParams)

  try {
    const { data, error } = await supabase
      .from('download_clicks')
      .select('user_agent')
      .gte('created_at', from)
      .lte('created_at', to)
      .limit(10000)

    if (error) throw error

    const counts = new Map<string, number>()
    for (const row of data || []) {
      const bucket = classifyDevice((row as any).user_agent || '')
      counts.set(bucket, (counts.get(bucket) || 0) + 1)
    }

    const items: DeviceRow[] = Array.from(counts.entries()).map(([device, count]) => ({ device, count }))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('analytics-en devices error', error)
    return NextResponse.json({ items: [] })
  }
}

function classifyDevice(ua: string): string {
  const v = ua.toLowerCase()
  if (!v) return 'Other'
  if (/bot|crawl|spider|slurp/.test(v)) return 'Bot'
  const isTablet = /ipad|tablet|kindle|silk|playbook/.test(v)
  const isMobile = /iphone|android|mobile|opera mini|blackberry|phone/.test(v)
  if (isTablet) return 'Tablet'
  if (isMobile && !isTablet) return 'Mobile'
  if (/windows|macintosh|linux|cros|x11/.test(v)) return 'Desktop'
  return 'Other'
}

function parseRange(params: URLSearchParams) {
  const toRaw = params.get('to')
  const fromRaw = params.get('from')
  const now = new Date()
  const to = toRaw ? new Date(toRaw) : now
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
