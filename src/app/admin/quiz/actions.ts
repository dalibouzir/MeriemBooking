'use server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export type QuizContendor = {
  id: number
  created_at: string
  name: string
  email: string
  result_type: string
  secondary_type: string | null
  shadow_type: string
}

export type QuizOverview = {
  total: number
  today: number
  uniqueEmails: number
  mixedResults: number
  topResultType: string
  topShadowType: string
}

export type QuizDistributionPoint = {
  label: string
  count: number
}

export type QuizDailyPoint = {
  date: string
  count: number
}

export type QuizInsights = {
  daily: QuizDailyPoint[]
  byResultType: QuizDistributionPoint[]
  byShadowType: QuizDistributionPoint[]
}

export type QuizFilters = {
  search?: string
  resultType?: string
  shadowType?: string
  mixedOnly?: boolean
  page?: number
  pageSize?: number
}

export type QuizListResult = {
  data: QuizContendor[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 20

function isMissingQuizTableError(message: string) {
  return (
    message.includes("Could not find the table 'public.quiz_contendors' in the schema cache")
    || message.includes('relation "public.quiz_contendors" does not exist')
  )
}

function safeDateOnly(iso: string) {
  return iso.split('T')[0]
}

function sortDistributionDesc(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getQuizOverviewAction(): Promise<QuizOverview> {
  const supabase = getSupabaseAdmin()

  const { count: totalCount, error: totalError } = await supabase
    .from('quiz_contendors')
    .select('*', { count: 'exact', head: true })

  if (totalError) {
    if (isMissingQuizTableError(totalError.message)) {
      return {
        total: 0,
        today: 0,
        uniqueEmails: 0,
        mixedResults: 0,
        topResultType: '—',
        topShadowType: '—',
      }
    }
    throw new Error(totalError.message)
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const { count: todayCount, error: todayError } = await supabase
    .from('quiz_contendors')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  if (todayError) {
    if (!isMissingQuizTableError(todayError.message)) throw new Error(todayError.message)
  }

  const { data: allRows, error: allRowsError } = await supabase
    .from('quiz_contendors')
    .select('email, result_type, shadow_type, secondary_type')

  if (allRowsError) {
    if (!isMissingQuizTableError(allRowsError.message)) throw new Error(allRowsError.message)
    return {
      total: totalCount || 0,
      today: todayCount || 0,
      uniqueEmails: 0,
      mixedResults: 0,
      topResultType: '—',
      topShadowType: '—',
    }
  }

  const uniqueEmails = new Set<string>()
  const resultTypeCounts = new Map<string, number>()
  const shadowTypeCounts = new Map<string, number>()
  let mixedResults = 0

  for (const row of allRows || []) {
    const emailKey = (row.email || '').trim().toLowerCase()
    if (emailKey) uniqueEmails.add(emailKey)

    const resultLabel = row.result_type || '—'
    resultTypeCounts.set(resultLabel, (resultTypeCounts.get(resultLabel) || 0) + 1)

    const shadowLabel = row.shadow_type || '—'
    shadowTypeCounts.set(shadowLabel, (shadowTypeCounts.get(shadowLabel) || 0) + 1)

    if (row.secondary_type) mixedResults += 1
  }

  const topResultType = sortDistributionDesc(resultTypeCounts)[0]?.label || '—'
  const topShadowType = sortDistributionDesc(shadowTypeCounts)[0]?.label || '—'

  return {
    total: totalCount || 0,
    today: todayCount || 0,
    uniqueEmails: uniqueEmails.size,
    mixedResults,
    topResultType,
    topShadowType,
  }
}

export async function getQuizInsightsAction(days = 14): Promise<QuizInsights> {
  const supabase = getSupabaseAdmin()

  const safeDays = Math.min(Math.max(days, 7), 60)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - (safeDays - 1))
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('quiz_contendors')
    .select('created_at, result_type, shadow_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return { daily: [], byResultType: [], byShadowType: [] }
    }
    throw new Error(error.message)
  }

  const dailyMap = new Map<string, number>()
  const resultTypeMap = new Map<string, number>()
  const shadowTypeMap = new Map<string, number>()

  for (let i = 0; i < safeDays; i += 1) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    dailyMap.set(d.toISOString().split('T')[0], 0)
  }

  for (const row of data || []) {
    const day = safeDateOnly(row.created_at)
    if (dailyMap.has(day)) {
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    }

    const resultType = row.result_type || '—'
    resultTypeMap.set(resultType, (resultTypeMap.get(resultType) || 0) + 1)

    const shadowType = row.shadow_type || '—'
    shadowTypeMap.set(shadowType, (shadowTypeMap.get(shadowType) || 0) + 1)
  }

  const daily = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  return {
    daily,
    byResultType: sortDistributionDesc(resultTypeMap),
    byShadowType: sortDistributionDesc(shadowTypeMap),
  }
}

export async function listQuizContendorsAction(filters: QuizFilters = {}): Promise<QuizListResult> {
  const supabase = getSupabaseAdmin()
  const {
    search,
    resultType,
    shadowType,
    mixedOnly,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters

  let query = supabase
    .from('quiz_contendors')
    .select('*', { count: 'exact' })

  if (resultType && resultType !== 'all') {
    query = query.eq('result_type', resultType)
  }

  if (shadowType && shadowType !== 'all') {
    query = query.eq('shadow_type', shadowType)
  }

  if (mixedOnly) {
    query = query.not('secondary_type', 'is', null)
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},email.ilike.${term},result_type.ilike.${term},shadow_type.ilike.${term}`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return { data: [], total: 0, page, pageSize }
    }
    throw new Error(error.message)
  }

  return {
    data: (data || []) as QuizContendor[],
    total: count || 0,
    page,
    pageSize,
  }
}

export async function exportQuizCsvAction(filters: Pick<QuizFilters, 'search' | 'resultType' | 'shadowType' | 'mixedOnly'> = {}) {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('quiz_contendors')
    .select('id, created_at, name, email, result_type, secondary_type, shadow_type')
    .order('created_at', { ascending: false })

  if (filters.resultType && filters.resultType !== 'all') {
    query = query.eq('result_type', filters.resultType)
  }

  if (filters.shadowType && filters.shadowType !== 'all') {
    query = query.eq('shadow_type', filters.shadowType)
  }

  if (filters.mixedOnly) {
    query = query.not('secondary_type', 'is', null)
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`name.ilike.${term},email.ilike.${term},result_type.ilike.${term},shadow_type.ilike.${term}`)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingQuizTableError(error.message)) {
      return { csv: 'id,created_at,name,email,result_type,secondary_type,shadow_type\n', filename: `quiz-contendors-empty-${Date.now()}.csv` }
    }
    throw new Error(error.message)
  }

  const rows = data || []
  const header = ['id', 'created_at', 'name', 'email', 'result_type', 'secondary_type', 'shadow_type']
  const csvRows = [header.join(',')]

  const escape = (value: unknown) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replaceAll('"', '""')}"`
    }
    return text
  }

  for (const row of rows) {
    csvRows.push([
      escape(row.id),
      escape(row.created_at),
      escape(row.name),
      escape(row.email),
      escape(row.result_type),
      escape(row.secondary_type),
      escape(row.shadow_type),
    ].join(','))
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return {
    csv: csvRows.join('\n'),
    filename: `quiz-contendors-${now}.csv`,
  }
}
