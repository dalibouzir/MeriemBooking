'use server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import type { ChallengeSettings } from '@/app/challenge/actions'

// Types for admin
export type AdminOverview = {
  capacity: number
  confirmed_count: number
  remaining_count: number
  waitlist_count: number
  copied_count: number
  saved_count: number
  not_copied_count: number
}

export type ChartDataPoint = {
  date: string
  confirmed: number
  waitlist: number
}

export type Registration = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  status: 'confirmed' | 'waitlist'
  link_copied_at: string | null
  link_saved_at: string | null
}

export type RegistrationFilters = {
  status?: 'all' | 'confirmed' | 'waitlist'
  notCopied?: boolean
  saved?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export type RegistrationListResult = {
  data: Registration[]
  total: number
  page: number
  pageSize: number
}

/**
 * Get admin overview stats
 */
export async function getAdminOverviewAction(): Promise<AdminOverview> {
  const supabase = getSupabaseAdmin()

  // Get settings for capacity
  const { data: settings } = await supabase
    .from('challenge_settings')
    .select('capacity')
    .limit(1)
    .single()

  const capacity = settings?.capacity || 0

  // Count confirmed
  const { count: confirmedCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  // Count waitlist
  const { count: waitlistCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'waitlist')

  // Count copied (confirmed only)
  const { count: copiedCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .not('link_copied_at', 'is', null)

  // Count saved (confirmed only)
  const { count: savedCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .not('link_saved_at', 'is', null)

  const confirmed_count = confirmedCount || 0
  const waitlist_count = waitlistCount || 0
  const copied_count = copiedCount || 0
  const saved_count = savedCount || 0
  const not_copied_count = confirmed_count - copied_count

  return {
    capacity,
    confirmed_count,
    remaining_count: Math.max(capacity - confirmed_count, 0),
    waitlist_count,
    copied_count,
    saved_count,
    not_copied_count,
  }
}

/**
 * Get chart data for last 14 days
 */
export async function getAdminChartDataAction(): Promise<ChartDataPoint[]> {
  const supabase = getSupabaseAdmin()

  // Calculate date range (last 14 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 13)

  // Get all registrations in the date range
  const { data: registrations } = await supabase
    .from('challenge_registrations')
    .select('created_at, status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  // Group by date and status
  const dateMap = new Map<string, { confirmed: number; waitlist: number }>()

  // Initialize all dates in range
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateKey = d.toISOString().split('T')[0]
    dateMap.set(dateKey, { confirmed: 0, waitlist: 0 })
  }

  // Count registrations per day
  for (const reg of registrations || []) {
    const dateKey = reg.created_at.split('T')[0]
    const entry = dateMap.get(dateKey)
    if (entry) {
      if (reg.status === 'confirmed') entry.confirmed++
      else if (reg.status === 'waitlist') entry.waitlist++
    }
  }

  // Convert to array sorted by date
  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, counts]) => ({
      date,
      confirmed: counts.confirmed,
      waitlist: counts.waitlist,
    }))
}

/**
 * Get challenge settings for admin editing
 */
export async function getAdminChallengeSettingsAction(): Promise<ChallengeSettings | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('challenge_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching settings:', error)
    return null
  }

  return data as ChallengeSettings
}

/**
 * Update challenge settings
 */
export async function updateChallengeSettingsAction(
  payload: Partial<ChallengeSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  // Get current settings to get the ID
  const { data: current } = await supabase
    .from('challenge_settings')
    .select('id')
    .limit(1)
    .single()

  if (!current) {
    return { success: false, error: 'Settings not found' }
  }

  const { error } = await supabase
    .from('challenge_settings')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)

  if (error) {
    console.error('Error updating settings:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * List registrations with filters, search, and pagination
 */
export async function listRegistrationsAction(
  filters: RegistrationFilters = {}
): Promise<RegistrationListResult> {
  const supabase = getSupabaseAdmin()
  const { status = 'all', notCopied, saved, search, page = 1, pageSize = 20 } = filters

  let query = supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact' })

  // Status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Not copied filter (confirmed only)
  if (notCopied) {
    query = query.eq('status', 'confirmed').is('link_copied_at', null)
  }

  // Saved filter
  if (saved) {
    query = query.not('link_saved_at', 'is', null)
  }

  // Search filter
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`email.ilike.${term},name.ilike.${term},phone.ilike.${term}`)
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing registrations:', error)
    return { data: [], total: 0, page, pageSize }
  }

  return {
    data: (data || []) as Registration[],
    total: count || 0,
    page,
    pageSize,
  }
}

/**
 * Update a registration
 */
export async function updateRegistrationAction(
  id: string,
  fields: Partial<Pick<Registration, 'name' | 'email' | 'phone' | 'status'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('challenge_registrations')
    .update(fields)
    .eq('id', id)

  if (error) {
    console.error('Error updating registration:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete a registration
 */
export async function deleteRegistrationAction(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('challenge_registrations').delete().eq('id', id)

  if (error) {
    console.error('Error deleting registration:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Promote a waitlist registration to confirmed (if capacity allows)
 */
export async function promoteWaitlistAction(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  // Check capacity
  const overview = await getAdminOverviewAction()
  if (overview.remaining_count <= 0) {
    return { success: false, error: 'No remaining capacity' }
  }

  // Check the registration is on waitlist
  const { data: reg } = await supabase
    .from('challenge_registrations')
    .select('status')
    .eq('id', id)
    .single()

  if (!reg) {
    return { success: false, error: 'Registration not found' }
  }

  if (reg.status !== 'waitlist') {
    return { success: false, error: 'Registration is not on waitlist' }
  }

  // Update to confirmed
  const { error } = await supabase
    .from('challenge_registrations')
    .update({ status: 'confirmed' })
    .eq('id', id)

  if (error) {
    console.error('Error promoting registration:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Export registrations to CSV format
 */
export async function exportCsvAction(
  filter: 'all' | 'confirmed' | 'waitlist'
): Promise<{ csv: string; filename: string }> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('challenge_registrations')
    .select('id, created_at, name, email, phone, status, link_copied_at, link_saved_at')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data } = await query

  // Generate CSV
  const headers = ['ID', 'Created At', 'Name', 'Email', 'Phone', 'Status', 'Link Copied At', 'Link Saved At']
  const rows = (data || []).map((r) => [
    r.id,
    r.created_at,
    r.name,
    r.email,
    r.phone || '',
    r.status,
    r.link_copied_at || '',
    r.link_saved_at || '',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  const now = new Date().toISOString().split('T')[0]
  const filename = `challenge-registrations-${filter}-${now}.csv`

  return { csv, filename }
}
