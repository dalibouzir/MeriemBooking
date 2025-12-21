import { NextRequest, NextResponse } from 'next/server'
import {
  applyClickFilters,
  applyRequestFilters,
  classifyDevice,
  escapeLike,
  getAdminClient,
  matchesDevice,
  parseFilters,
} from '../shared'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 10000

type ExportType = 'requests' | 'clicks'

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const type = (req.nextUrl.searchParams.get('type') || 'requests') as ExportType
  const search = (req.nextUrl.searchParams.get('search') || '').trim()

  try {
    if (type === 'clicks') {
      const rows = await fetchClicks(supabase, filters, search)
      const csv = clicksToCsv(rows)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="analytics-clicks.csv"',
        },
      })
    }

    const rows = await fetchRequests(supabase, filters, search)
    const csv = requestsToCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="analytics-requests.csv"',
      },
    })
  } catch (error) {
    console.error('analytics export error', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

async function fetchRequests(supabase: any, filters: any, search: string) {
  const baseQuery = applyRequestFilters(
    supabase
      .from('download_requests')
      .select('created_at, name, first_name, last_name, email, product_slug, phone, country, meta')
      .limit(MAX_ROWS),
    filters
  )

  if (!filters.devices.length) {
    let query = baseQuery
    if (search) {
      const term = `%${escapeLike(search)}%`
      query = query.or(
        `name.ilike.${term},email.ilike.${term},phone.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},click_id.ilike.${term}`
      )
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  const { data, error } = await baseQuery.order('created_at', { ascending: false })
  if (error) throw error
  let rows = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
  if (search) rows = rows.filter((row: Record<string, unknown>) => matchesRequestSearch(row as Record<string, unknown>, search))
  return rows.slice(0, MAX_ROWS)
}

async function fetchClicks(supabase: any, filters: any, search: string) {
  const baseQuery = applyClickFilters(
    supabase
      .from('download_clicks')
      .select('created_at, product_slug, source, referrer, click_id, user_agent, meta')
      .limit(MAX_ROWS),
    filters
  ).or('meta->>event.eq.click,meta->>event.is.null')

  if (!filters.devices.length) {
    let query = baseQuery
    if (search) {
      const term = `%${escapeLike(search)}%`
      query = query.or(`click_id.ilike.${term},referrer.ilike.${term},user_agent.ilike.${term}`)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  const { data, error } = await baseQuery.order('created_at', { ascending: false })
  if (error) throw error
  let rows = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
  if (search) rows = rows.filter((row: Record<string, unknown>) => matchesClickSearch(row as Record<string, unknown>, search))
  return rows.slice(0, MAX_ROWS)
}

function requestsToCsv(rows: any[]) {
  const header = ['created_at', 'product_slug', 'name', 'email', 'phone', 'country', 'source', 'click_id', 'device']
  const lines = [header.join(',')]

  for (const row of rows || []) {
    const name = combineName((row as any).first_name, (row as any).last_name, (row as any).name)
    const device = classifyDevice((row as any).user_agent)
    const fields = [
      (row as any).created_at,
      (row as any).product_slug || '',
      name,
      (row as any).email || '',
      (row as any).phone || '',
      (row as any).country || '',
      (row as any).source || '',
      (row as any).click_id || '',
      device,
    ].map(csvEscape)
    lines.push(fields.join(','))
  }

  return lines.join('\n')
}

function clicksToCsv(rows: any[]) {
  const header = ['created_at', 'product_slug', 'source', 'referrer', 'click_id', 'device']
  const lines = [header.join(',')]

  for (const row of rows || []) {
    const device = classifyDevice((row as any).user_agent)
    const fields = [
      (row as any).created_at,
      (row as any).product_slug || '',
      (row as any).source || '',
      (row as any).referrer || '',
      (row as any).click_id || '',
      device,
    ].map(csvEscape)
    lines.push(fields.join(','))
  }

  return lines.join('\n')
}

function csvEscape(value: unknown) {
  const str = (value ?? '').toString()
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function combineName(first?: string | null, last?: string | null, fallback?: string | null) {
  const combined = `${first || ''} ${last || ''}`.trim()
    || (fallback || '').trim()
  return combined
}

function matchesRequestSearch(row: { [key: string]: unknown }, search: string) {
  const haystack = [row.name, row.first_name, row.last_name, row.email, row.phone, row.click_id]
    .map((v) => (v || '').toString().toLowerCase())
    .filter(Boolean)
  const needle = search.toLowerCase()
  return haystack.some((val) => val.includes(needle))
}

function matchesClickSearch(row: { [key: string]: unknown }, search: string) {
  const haystack = [row.click_id, row.referrer, row.user_agent]
    .map((v) => (v || '').toString().toLowerCase())
    .filter(Boolean)
  const needle = search.toLowerCase()
  return haystack.some((val) => val.includes(needle))
}
