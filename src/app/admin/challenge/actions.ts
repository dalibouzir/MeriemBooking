'use server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmailWithRetry } from '@/lib/resend'
import type { ChallengeSettings } from '@/app/challenge/actions'

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

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
  vip_day3_access: boolean
  vip_day3_granted_at: string | null
  vip_day3_granted_by: string | null
  vip_payment_source: string | null
  vip_payment_note: string | null
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
  const urlFields: Array<keyof ChallengeSettings> = [
    'meeting_url',
    'day1_zoom_url',
    'day2_zoom_url',
    'day3_paid_calendly_url',
    'day3_vip_zoom_url',
  ]

  for (const field of urlFields) {
    const value = payload[field]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed) continue
    if (!isValidHttpUrl(trimmed)) {
      return { success: false, error: `Invalid URL in ${field}` }
    }
    ;(payload as Record<string, unknown>)[field] = trimmed
  }

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
    .select('id, created_at, name, email, phone, status, link_copied_at, link_saved_at, vip_day3_access, vip_day3_granted_at, vip_day3_granted_by, vip_payment_source, vip_payment_note')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data } = await query

  // Generate CSV
  const headers = ['ID', 'Created At', 'Name', 'Email', 'Phone', 'Status', 'Link Copied At', 'Link Saved At', 'VIP Day3 Access', 'VIP Granted At', 'VIP Granted By', 'VIP Payment Source', 'VIP Payment Note']
  const rows = (data || []).map((r) => [
    r.id,
    r.created_at,
    r.name,
    r.email,
    r.phone || '',
    r.status,
    r.link_copied_at || '',
    r.link_saved_at || '',
    r.vip_day3_access ? 'true' : 'false',
    r.vip_day3_granted_at || '',
    r.vip_day3_granted_by || '',
    r.vip_payment_source || '',
    r.vip_payment_note || '',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  const now = new Date().toISOString().split('T')[0]
  const filename = `challenge-registrations-${filter}-${now}.csv`

  return { csv, filename }
}

export async function grantVipDay3AccessAction({
  registrationId,
  paymentSource = 'manual',
  paymentNote = '',
  sendEmail = true,
  grantedBy = 'admin',
}: {
  registrationId: string
  paymentSource?: string
  paymentNote?: string
  sendEmail?: boolean
  grantedBy?: string
}): Promise<{ success: boolean; error?: string; warning?: string }> {
  const supabase = getSupabaseAdmin()

  const { data: registration, error: regError } = await supabase
    .from('challenge_registrations')
    .select('id, name, email')
    .eq('id', registrationId)
    .single()

  if (regError || !registration) {
    return { success: false, error: 'Registration not found' }
  }

  const { error: updateError } = await supabase
    .from('challenge_registrations')
    .update({
      vip_day3_access: true,
      vip_day3_granted_at: new Date().toISOString(),
      vip_day3_granted_by: grantedBy,
      vip_payment_source: paymentSource,
      vip_payment_note: paymentNote || null,
    })
    .eq('id', registrationId)

  if (updateError) {
    console.error('Error granting VIP access:', updateError)
    return { success: false, error: updateError.message }
  }

  if (!sendEmail) {
    return { success: true }
  }

  const { data: settings, error: settingsError } = await supabase
    .from('challenge_settings')
    .select('day3_vip_zoom_url, starts_at, duration_minutes')
    .limit(1)
    .single()

  if (settingsError || !settings?.day3_vip_zoom_url) {
    return {
      success: true,
      warning: 'تم منح صلاحية VIP، لكن لم يتم إرسال الإيميل لأن رابط Zoom لليوم الثالث غير مضاف.',
    }
  }

  try {
    await sendVipDay3AccessEmail({
      name: registration.name,
      email: registration.email,
      vipMeetingUrl: settings.day3_vip_zoom_url,
      startsAt: settings.starts_at,
      durationMinutes: settings.duration_minutes,
      paymentSource,
      paymentNote,
    })
    return { success: true }
  } catch (err) {
    console.error('Error sending VIP email:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    return {
      success: true,
      warning: `تم منح صلاحية VIP، لكن فشل إرسال الإيميل. السبب: ${errorMessage}`,
    }
  }
}

export async function sendVipDay3EmailAction({
  registrationId,
}: {
  registrationId: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { data: registration, error: regError } = await supabase
    .from('challenge_registrations')
    .select('id, name, email, vip_day3_access, vip_payment_source, vip_payment_note')
    .eq('id', registrationId)
    .single()

  if (regError || !registration) {
    return { success: false, error: 'Registration not found' }
  }

  if (!registration.vip_day3_access) {
    return { success: false, error: 'VIP day 3 access is not granted for this registration yet' }
  }

  const { data: settings, error: settingsError } = await supabase
    .from('challenge_settings')
    .select('day3_vip_zoom_url, starts_at, duration_minutes')
    .limit(1)
    .single()

  if (settingsError || !settings?.day3_vip_zoom_url) {
    return { success: false, error: 'VIP Day 3 Zoom link is missing in challenge settings' }
  }

  try {
    await sendVipDay3AccessEmail({
      name: registration.name,
      email: registration.email,
      vipMeetingUrl: settings.day3_vip_zoom_url,
      startsAt: settings.starts_at,
      durationMinutes: settings.duration_minutes,
      paymentSource: registration.vip_payment_source || undefined,
      paymentNote: registration.vip_payment_note || undefined,
    })
    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMessage }
  }
}

async function sendVipDay3AccessEmail({
  name,
  email,
  vipMeetingUrl,
  startsAt,
  durationMinutes,
  paymentSource,
  paymentNote,
}: {
  name: string
  email: string
  vipMeetingUrl: string
  startsAt: string
  durationMinutes?: number
  paymentSource?: string
  paymentNote?: string
}) {
  const supabase = getSupabaseAdmin()
  const vipPayload = {
    name,
    email,
    vipMeetingUrl,
    startsAt,
    durationMinutes,
    paymentSource,
    paymentNote,
  }

  const { error } = await supabase.functions.invoke('send-challenge-vip-email', {
    body: vipPayload,
  })

  if (!error) return

  // Fallback: send VIP template directly through Resend from server action.
  try {
    await sendEmailWithRetry({
      from: getVipFromAddress(),
      to: email,
      subject: '✨ تم تفعيل دخولك VIP لليوم الثالث',
      html: buildVipHtml({
        name,
        vipMeetingUrl,
        startsAt,
        durationMinutes,
        paymentSource,
        paymentNote,
      }),
    })
  } catch (fallbackErr) {
    const vipErrorMessage = parseInvokeError(error)
    const fallbackErrorMessage = parseInvokeError(fallbackErr)
    throw new Error(`VIP function failed: ${vipErrorMessage} | direct resend failed: ${fallbackErrorMessage}`)
  }
}

function parseInvokeError(error: unknown): string {
  if (!error) return 'Unknown error'
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string') return maybeMessage
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

function getVipFromAddress() {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'noreply@fittrahmoms.com'
  return `Fittrah Women <${fromEmail}>`
}

function formatDateArabic(dateStr?: string) {
  if (!dateStr) return 'سيتم إعلامك بالموعد'
  try {
    return new Date(dateStr).toLocaleDateString('ar-u-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function buildVipHtml({
  name,
  vipMeetingUrl,
  startsAt,
  durationMinutes,
  paymentSource,
  paymentNote,
}: {
  name: string
  vipMeetingUrl: string
  startsAt: string
  durationMinutes?: number
  paymentSource?: string
  paymentNote?: string
}) {
  const greet = name?.trim() ? name.trim() : 'عزيزتي'
  const dayDate = formatDateArabic(startsAt)
  const sourceLine = paymentSource ? `<p style="margin:0 0 4px">طريقة الدفع: ${escapeHtml(paymentSource)}</p>` : ''
  const noteLine = paymentNote ? `<p style="margin:0 0 4px">ملاحظة: ${escapeHtml(paymentNote)}</p>` : ''

  return `
    <div style="font-family:Tajawal,Tahoma,Arial,sans-serif;direction:rtl;text-align:right;background:#f4f3ff;padding:24px;color:#111">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #e9d5ff;box-shadow:0 18px 42px rgba(124,58,237,.16);overflow:hidden">
        <div style="padding:22px 24px;background:linear-gradient(145deg,#f5edff,#eef2ff);border-bottom:1px solid #e9d5ff">
          <h1 style="margin:0;font-size:22px;color:#6d28d9">✨ تم تفعيل دخولك VIP لليوم الثالث</h1>
        </div>
        <div style="padding:20px 24px;line-height:1.9;font-size:15px">
          <p style="margin:0 0 10px">مرحبًا <strong>${escapeHtml(greet)}</strong>،</p>
          <p style="margin:0 0 10px">تم تفعيل وصولك إلى جلسة VIP (اليوم الثالث) بنجاح.</p>
          <p style="margin:0 0 12px"><strong>موعد الجلسة:</strong> ${escapeHtml(dayDate)}</p>
          <p style="margin:0 0 8px"><strong>رابط Zoom الخاص بجلسة VIP:</strong></p>
          <p style="margin:0 0 18px"><a href="${escapeAttr(vipMeetingUrl)}" target="_blank" rel="noopener noreferrer" style="color:#6d28d9;font-weight:700;text-decoration:none">${escapeHtml(vipMeetingUrl)}</a></p>
          ${sourceLine}
          ${noteLine}
          <p style="margin:14px 0 0">نراك قريبًا 💜</p>
          <p style="margin:6px 0 0;color:#6d28d9;font-weight:700">Fittrah Women</p>
        </div>
      </div>
    </div>
  `.trim()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttr(value: string) {
  return escapeHtml(value)
}
