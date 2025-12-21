import { NextRequest, NextResponse } from 'next/server'
import {
  applyRequestFilters,
  escapeLike,
  getAdminClient,
  matchesDevice,
  parseFilters,
  parsePagination,
  parseSort,
  stripAdvancedFilters,
} from '../shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const filters = parseFilters(req.nextUrl.searchParams)
  const pagination = parsePagination(req.nextUrl.searchParams, { page: 1, pageSize: 25 })
  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const sort = parseSort(req.nextUrl.searchParams, ['created_at', 'product_slug', 'email', 'country', 'source'], 'created_at')

  try {
    const baseQuery = applyRequestFilters(
      supabase
        .from('download_requests')
        .select('id, created_at, name, first_name, last_name, email, product_slug, phone, country, meta', {
          count: 'exact',
        }),
      filters
    )

    if (filters.devices.length) {
      const { data, error } = await baseQuery
        .order(sort.field || 'created_at', { ascending: sort.direction === 'asc' })
        .limit(10000)

      if (error) throw error
      const filtered = (data || []).filter((row: Record<string, unknown>) => matchesDevice((row as Record<string, unknown>).user_agent as string, filters.devices))
      const searched = search
        ? filtered.filter((row: Record<string, unknown>) => matchesSearch(row as Record<string, unknown>, search))
        : filtered

      const total = searched.length
      const start = (pagination.page - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      const rows = searched.slice(start, end)

      return NextResponse.json({ rows, total, page: pagination.page, pageSize: pagination.pageSize })
    }

    let query = baseQuery
    if (search) {
      const term = `%${escapeLike(search)}%`
      query = query.or(
        `name.ilike.${term},email.ilike.${term},phone.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},click_id.ilike.${term}`
      )
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
    console.warn('requests endpoint fallback', error)
    try {
      const stripped = stripAdvancedFilters(filters)
      const baseQuery = applyRequestFilters(
        supabase
          .from('download_requests')
          .select('id, created_at, name, first_name, last_name, email, product_slug, phone', { count: 'exact' }),
        stripped
      )

      let query = baseQuery
      if (search) {
        const term = `%${escapeLike(search)}%`
        query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
      }
      query = query.order(sort.field || 'created_at', { ascending: sort.direction === 'asc' })
      const start = (pagination.page - 1) * pagination.pageSize
      const end = start + pagination.pageSize - 1
      query = query.range(start, end)
      const { data, error: err2, count } = await query
      if (err2) throw err2
      const rows = (data || []).map((row: Record<string, unknown>) => ({ ...row, country: null }))
      return NextResponse.json({ rows, total: count || 0, page: pagination.page, pageSize: pagination.pageSize })
    } catch (err3) {
      console.error('analytics requests table error', err3)
      return NextResponse.json({ rows: [], total: 0, page: pagination.page, pageSize: pagination.pageSize })
    }
  }
}

function matchesSearch(row: { [key: string]: unknown }, search: string) {
  const haystack = [row.name, row.first_name, row.last_name, row.email, row.phone, row.click_id]
    .map((v) => (v || '').toString().toLowerCase())
    .filter(Boolean)
  const needle = search.toLowerCase()
  return haystack.some((val) => val.includes(needle))
}
