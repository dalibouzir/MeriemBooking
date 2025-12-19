import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export type AnalyticsFilters = {
  from: string
  to: string
  products: string[]
  sources: string[]
  countries: string[]
  devices: DeviceCategory[]
  referrer: string | null
}

export type Pagination = { page: number; pageSize: number }
export type Sort = { field?: string; direction?: 'asc' | 'desc' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any

const cacheStore = new Map<string, { expiresAt: number; payload: unknown }>()

export function stripAdvancedFilters(filters: AnalyticsFilters): AnalyticsFilters {
  return {
    ...filters,
    sources: [],
    countries: [],
    devices: [],
    referrer: null,
  }
}

export function isAdmin(email?: string | null) {
  const envEmail = (process.env.MERIEM_ADMIN_EMAIL || '').trim().toLowerCase()
  const allowed = envEmail || 'meriembouzir05@gmail.com'
  return (email || '').trim().toLowerCase() === allowed
}

export async function getAdminClient(): Promise<SupabaseClient | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return getSupabaseAdmin()
}

export function parseFilters(params: URLSearchParams): AnalyticsFilters {
  const now = Date.now()
  const toParam = params.get('to')
  const fromParam = params.get('from')

  const to = sanitizeDate(toParam) ?? new Date(now)
  const from = sanitizeDate(fromParam) ?? new Date(now - 30 * 24 * 60 * 60 * 1000)

  const normalizedFrom = from > to ? new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000) : from

  const parseList = (value: string | null) =>
    (value || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)

  const devices = parseList(params.get('device')).map((d) => normalizeDevice(d)).filter(Boolean) as DeviceCategory[]

  return {
    from: normalizedFrom.toISOString(),
    to: to.toISOString(),
    products: parseList(params.get('products')),
    sources: parseList(params.get('sources')),
    countries: parseList(params.get('countries')),
    devices,
    referrer: (params.get('referrer') || '').trim() || null,
  }
}

export function applyClickFilters(query: Query, filters: AnalyticsFilters) {
  let q = query
    .gte('created_at', filters.from)
    .lte('created_at', filters.to)

  if (filters.products.length) q = q.in('product_slug', filters.products)
  if (filters.sources.length) q = q.in('source', filters.sources)
  if (filters.referrer) q = q.ilike('referrer', `%${escapeLike(filters.referrer)}%`)

  return q
}

export function applyRequestFilters(query: Query, filters: AnalyticsFilters) {
  let q = query
    .gte('created_at', filters.from)
    .lte('created_at', filters.to)

  if (filters.products.length) q = q.in('product_slug', filters.products)

  const countryKnown = filters.countries.filter((c) => c && c.toLowerCase() !== 'unknown')
  const allowCountryUnknown = filters.countries.some((c) => c.toLowerCase() === 'unknown')

  const sourceKnown = filters.sources.filter((s) => s && s.toLowerCase() !== 'unknown')
  const allowSourceUnknown = filters.sources.some((s) => s.toLowerCase() === 'unknown')

  const countryExprs = buildColumnExpr('country', countryKnown, allowCountryUnknown)
  const sourceExprs = buildColumnExpr('source', sourceKnown, allowSourceUnknown)

  if (countryExprs.length || sourceExprs.length) {
    const combos: string[] = []
    const cList = countryExprs.length ? countryExprs : ['']
    const sList = sourceExprs.length ? sourceExprs : ['']

    for (const c of cList) {
      for (const s of sList) {
        const parts = [c, s].filter(Boolean).join(',')
        if (parts) combos.push(`and(${parts})`)
      }
    }

    if (combos.length) q = q.or(combos.join(','))
  }

  return q
}

function buildColumnExpr(column: string, known: string[], allowUnknown: boolean) {
  const expressions: string[] = []
  if (known.length) expressions.push(`${column}.in.(${encodeList(known)})`)
  if (allowUnknown) expressions.push(`${column}.is.null`, `${column}.eq.`)
  return expressions
}

function sanitizeDate(raw?: string | null) {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeDevice(input: string): DeviceCategory | 'unknown' {
  const val = input.trim().toLowerCase()
  if (val === 'mobile' || val === 'tablet' || val === 'desktop') return val
  if (val === 'unknown') return 'unknown'
  return 'unknown'
}

export function parsePagination(params: URLSearchParams, defaults: Pagination = { page: 1, pageSize: 20 }): Pagination {
  const page = Math.max(1, Number(params.get('page') || defaults.page || 1))
  const rawSize = Math.max(1, Number(params.get('pageSize') || defaults.pageSize || 20))
  const pageSize = Math.min(rawSize, 200)
  return { page, pageSize }
}

export function parseSort(params: URLSearchParams, allowed: string[], defaultField: string, defaultDirection: 'asc' | 'desc' = 'desc'): Sort {
  const field = (params.get('sort') || '').trim()
  const direction = ((params.get('direction') || '').toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
  if (!field || !allowed.includes(field)) return { field: defaultField, direction: defaultDirection }
  return { field, direction }
}

export function escapeLike(value: string) {
  return value.replace(/([%_])/g, '\\$1')
}

export function classifyDevice(userAgent?: string | null): DeviceCategory {
  const ua = (userAgent || '').toLowerCase()
  if (!ua) return 'unknown'
  const isTablet = /ipad|tablet|sm-t|kindle|silk|playbook/.test(ua)
  const isMobile = /iphone|android|mobile|opera mini|blackberry|phone/.test(ua)
  if (isTablet) return 'tablet'
  if (isMobile && !isTablet) return 'mobile'
  return 'desktop'
}

export function matchesDevice(userAgent: string | null | undefined, desired: DeviceCategory[]): boolean {
  if (!desired || desired.length === 0) return true
  const bucket = classifyDevice(userAgent)
  return desired.includes(bucket)
}

export function bucketize(rows: { created_at?: string | null }[], interval: 'hour' | 'day') {
  const map = new Map<string, number>()
  for (const row of rows) {
    const ts = row?.created_at ? Date.parse(row.created_at) : NaN
    if (!Number.isNaN(ts)) {
      const bucket = normalizeBucket(ts, interval)
      map.set(bucket, (map.get(bucket) || 0) + 1)
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([bucket, count]) => ({ bucket, count }))
}

export function normalizeBucket(ts: number, interval: 'hour' | 'day') {
  const d = new Date(ts)
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  if (interval === 'day') {
    return new Date(Date.UTC(year, month, day)).toISOString()
  }
  const hour = d.getUTCHours()
  return new Date(Date.UTC(year, month, day, hour)).toISOString()
}

export function determineInterval(fromIso: string, toIso: string, requested?: string | null) {
  if (requested === 'hour' || requested === 'day') return requested
  const diff = Math.abs(Date.parse(toIso) - Date.parse(fromIso))
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000
  return diff <= twoDaysMs ? 'hour' : 'day'
}

export function filtersKey(prefix: string, filters: AnalyticsFilters, extra?: Record<string, string | number | null | undefined>) {
  const extras = extra ? Object.entries(extra).map(([k, v]) => `${k}:${v ?? ''}`).join('|') : ''
  return [
    prefix,
    filters.from,
    filters.to,
    filters.products.join(','),
    filters.sources.join(','),
    filters.countries.join(','),
    filters.devices.join(','),
    filters.referrer || '',
    extras,
  ].join('::')
}

export async function withCache<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = cacheStore.get(key)
  if (hit && hit.expiresAt > now) {
    return hit.payload as T
  }
  const payload = await loader()
  cacheStore.set(key, { payload, expiresAt: now + ttlSeconds * 1000 })
  return payload
}

function encodeList(values: string[]) {
  return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',')
}
