// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { bulkEmailConfig, type BulkEmailConfig } from '@/lib/bulkEmailConfig'

export type BulkEmailFilters = {
  status: string[]
  tags: string[]
  countries: string[]
  from: string | null
  to: string | null
  search: string | null
}

export type Pagination = { page: number; pageSize: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Use a permissive any type for Supabase query builder to avoid Postgrest type parameter changes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Query = any

export function parseList(value: string | null): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseBulkEmailFilters(params: URLSearchParams): BulkEmailFilters {
  const from = normalizeDate(params.get('from'))
  const to = normalizeDate(params.get('to'))

  return {
    status: parseList(params.get('status')),
    tags: parseList(params.get('tags')),
    countries: parseList(params.get('country')),
    from,
    to,
    search: (params.get('search') || '').trim() || null,
  }
}

export function parsePagination(params: URLSearchParams, defaults: Pagination = { page: 1, pageSize: 25 }): Pagination {
  const page = Math.max(1, Number(params.get('page') || defaults.page))
  const rawSize = Math.max(1, Number(params.get('pageSize') || defaults.pageSize))
  const pageSize = Math.min(rawSize, 200)
  return { page, pageSize }
}

export function applyRecipientEligibilityFilters(query: Query, config: BulkEmailConfig = bulkEmailConfig): Query {
  const cols = config.columns
  if (cols.email) {
    query = query.not(cols.email, 'is', null).neq(cols.email, '')
  }
  if (cols.marketingOptIn) {
    query = query.eq(cols.marketingOptIn, true)
  }
  if (cols.unsubscribed) {
    query = query.neq(cols.unsubscribed, true)
  }
  return query
}

export function applyBulkEmailFilters(query: Query, filters: BulkEmailFilters, config: BulkEmailConfig = bulkEmailConfig): Query {
  const cols = config.columns
  if (filters.from && cols.createdAt) query = query.gte(cols.createdAt, filters.from)
  if (filters.to && cols.createdAt) query = query.lte(cols.createdAt, filters.to)

  if (filters.status.length && cols.status) {
    query = query.in(cols.status, filters.status)
  }

  if (filters.tags.length && cols.tags) {
    if (config.tagsMode === 'text') {
      const terms = filters.tags.map((tag) => `${cols.tags}.ilike.%${escapeLike(tag)}%`)
      query = query.or(terms.join(','))
    } else {
      query = query.overlaps(cols.tags, filters.tags)
    }
  }

  if (filters.countries.length && cols.country) {
    query = query.in(cols.country, filters.countries)
  }

  if (filters.search) {
    const term = `%${escapeLike(filters.search)}%`
    const searchCols = [cols.email, cols.firstName, cols.lastName].filter((col): col is string => Boolean(col))
    if (searchCols.length) {
      query = query.or(searchCols.map((col) => `${col}.ilike.${term}`).join(','))
    }
  }

  return query
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed) return false
  if (trimmed.length > 320) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(trimmed)
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (!items.length || size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function escapeLike(value: string) {
  return value.replace(/([%_])/g, '\\$1')
}

function normalizeDate(raw: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
