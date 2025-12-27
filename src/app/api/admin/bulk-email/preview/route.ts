import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'
import { bulkEmailConfig, buildUserSelectList, normalizeTagsValue } from '@/lib/bulkEmailConfig'
import {
  applyBulkEmailFilters,
  applyRecipientEligibilityFilters,
  isValidEmail,
  parseBulkEmailFilters,
  parsePagination,
} from '@/lib/bulkEmailUtils'

export const dynamic = 'force-dynamic'

const MAX_COUNT_SCAN = 10000

export async function GET(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const filters = parseBulkEmailFilters(req.nextUrl.searchParams)
  const pagination = parsePagination(req.nextUrl.searchParams, { page: 1, pageSize: 25 })

  const selectList = buildUserSelectList()
  const cols = bulkEmailConfig.columns

  try {
    let query = supabase
      .from(bulkEmailConfig.userTable)
      .select(selectList, { count: 'exact' })

    query = applyRecipientEligibilityFilters(query)
    query = applyBulkEmailFilters(query, filters)

    if (cols.createdAt) query = query.order(cols.createdAt, { ascending: false })

    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize - 1
    query = query.range(start, end)

    const { data, error, count } = await query
    if (error) throw error

    const rows = ((data || []) as unknown as Record<string, unknown>[]).map((row) => {
      const email = cols.email ? String(row[cols.email] || '') : ''
      return {
        id: cols.id ? row[cols.id] : null,
        email,
        first_name: cols.firstName ? row[cols.firstName] : null,
        last_name: cols.lastName ? row[cols.lastName] : null,
        created_at: cols.createdAt ? row[cols.createdAt] : null,
        status: cols.status ? row[cols.status] : null,
        tags: cols.tags ? normalizeTagsValue(row[cols.tags]) : [],
        country: cols.country ? row[cols.country] : null,
        email_valid: isValidEmail(email),
      }
    })

    const total = count || 0
    const validity = await getEmailValidityCounts(total, supabase, filters)

    return NextResponse.json({
      rows,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      counts: {
        eligible: total,
        valid: total - validity.invalid,
        invalid: validity.invalid,
        limited: validity.limited,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load preview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function getEmailValidityCounts(total: number, supabase: ReturnType<typeof getSupabaseAdmin>, filters: ReturnType<typeof parseBulkEmailFilters>) {
  if (!total) return { invalid: 0, limited: false }
  if (total > MAX_COUNT_SCAN) return { invalid: 0, limited: true }

  const cols = bulkEmailConfig.columns
  if (!cols.email) return { invalid: 0, limited: false }

  const emailCol = cols.email as string

  let query = supabase
    .from(bulkEmailConfig.userTable)
    .select(cols.email)

  query = applyRecipientEligibilityFilters(query)
  query = applyBulkEmailFilters(query, filters)
  query = query.limit(MAX_COUNT_SCAN)

  const { data, error } = await query
  if (error) return { invalid: 0, limited: true }

  const invalid = ((data || []) as unknown as Record<string, unknown>[]).reduce((count, row) => {
    const email = String(row[emailCol] || '')
    return count + (isValidEmail(email) ? 0 : 1)
  }, 0)

  return { invalid, limited: false }
}
