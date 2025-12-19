import { NextRequest, NextResponse } from 'next/server'
import {
  applyClickFilters,
  escapeLike,
  getAdminClient,
  matchesDevice,
  parseFilters,
  parsePagination,
  parseSort,
} from '../shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const pagination = parsePagination(req.nextUrl.searchParams, { page: 1, pageSize: 25 })
  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const sort = parseSort(req.nextUrl.searchParams, ['created_at', 'product_slug', 'source', 'referrer'], 'created_at')

  try {
    const baseQuery = applyClickFilters(
      supabase
        .from('download_clicks')
        .select('id, created_at, product_slug, source, referrer, click_id, user_agent, meta', { count: 'exact' }),
      filters
    ).or('meta->>event.eq.click,meta->>event.is.null')

    if (filters.devices.length) {
      const { data, error } = await baseQuery
        .order(sort.field || 'created_at', { ascending: sort.direction === 'asc' })
        .limit(10000)

      if (error) throw error
      const filtered = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
      const searched = search ? filtered.filter((row: Record<string, unknown>) => matchesSearch(row as Record<string, unknown>, search)) : filtered

      const total = searched.length
      const start = (pagination.page - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      const rows = searched.slice(start, end)

      return NextResponse.json({ rows, total, page: pagination.page, pageSize: pagination.pageSize })
    }

    let query = baseQuery
    if (search) {
      const term = `%${escapeLike(search)}%`
      query = query.or(`click_id.ilike.${term},referrer.ilike.${term},user_agent.ilike.${term}`)
    }

    query = query.order(sort.field || 'created_at', { ascending: sort.direction === 'asc' })
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize - 1
    query = query.range(start, end)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      rows: data || [],
      total: count || 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
  } catch (error) {
    console.error('analytics clicks table error', error)
    return NextResponse.json({ rows: [], total: 0, page: pagination.page, pageSize: pagination.pageSize })
  }
}

function matchesSearch(row: { [key: string]: unknown }, search: string) {
  const haystack = [row.click_id, row.referrer, row.user_agent]
    .map((v) => (v || '').toString().toLowerCase())
    .filter(Boolean)
  const needle = search.toLowerCase()
  return haystack.some((val) => val.includes(needle))
}
