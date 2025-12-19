import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/app/api/admin/analytics/shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await getAdminClient()
  if (supabase instanceof NextResponse) return supabase

  const { from, to } = parseRange(req.nextUrl.searchParams)
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1))
  const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') || 20)))
  const search = (req.nextUrl.searchParams.get('search') || '').trim()

  try {
    const response = await runQuery(supabase, { from, to, page, pageSize, search, full: true })
    return NextResponse.json({ ...response, from, to })
  } catch (error) {
    console.warn('analytics-en requests primary failed, retrying with minimal columns', error)
    try {
      const response = await runQuery(supabase, { from, to, page, pageSize, search, full: false })
      return NextResponse.json({ ...response, from, to })
    } catch (err2) {
      console.error('analytics-en requests error', err2)
      return NextResponse.json({ rows: [], total: 0, page, pageSize, from, to })
    }
  }
}

async function runQuery(
  supabase: any,
  opts: { from: string; to: string; page: number; pageSize: number; search: string; full: boolean }
) {
  const { from, to, page, pageSize, search, full } = opts

  const selectClause = full
    ? 'id, created_at, name, first_name, last_name, email, phone, product_slug, country, source, click_id, user_agent, meta'
    : 'id, created_at, name, first_name, last_name, email, phone, product_slug, country'

  let query = supabase
    .from('download_requests')
    .select(selectClause, { count: 'exact' })
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })

  if (search) {
    const term = `%${escapeLike(search)}%`
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  query = query.range(start, end)

  const { data, error, count } = await query
  if (error) throw error
  return { rows: data || [], total: count || 0, page, pageSize }
}

function escapeLike(value: string) {
  return value.replace(/([%_])/g, '\\$1')
}

function parseRange(params: URLSearchParams) {
  const toRaw = params.get('to')
  const fromRaw = params.get('from')
  const now = new Date()
  const to = toRaw ? new Date(toRaw) : now
  const from = fromRaw ? new Date(fromRaw) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
