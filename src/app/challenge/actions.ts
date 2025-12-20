'use server'

import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// Types for challenge data
export type ChallengeSettings = {
  id: string
  capacity: number
  meeting_url: string
  starts_at: string
  duration_minutes: number
  timezone: string
  updated_at: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  requirements: string[]
  faq: { q: string; a: string }[]
  is_active: boolean
}

export type ChallengeStats = {
  confirmed_count: number
  waitlist_count: number
  remaining: number
  capacity: number
}

export type RegistrationResult = {
  status: 'success' | 'full' | 'already_registered' | 'error'
  registration_id?: string
  remaining?: number
  error?: string
}

export type MeetingDetails = {
  meeting_url: string
  starts_at: string
  duration_minutes: number
  timezone: string
}

/**
 * Get challenge settings (public data only - no meeting_url)
 */
export async function getChallengeSettingsAction(): Promise<ChallengeSettings | null> {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('challenge_settings')
    .select('*')
    .limit(1)
    .single()
  
  if (error || !data) {
    console.error('Error fetching challenge settings:', error)
    return null
  }
  
  return data as ChallengeSettings
}

/**
 * Get challenge stats (counts for display)
 */
export async function getChallengeStatsAction(): Promise<ChallengeStats> {
  const supabase = getSupabaseAdmin()
  
  // Get settings for capacity
  const { data: settings } = await supabase
    .from('challenge_settings')
    .select('capacity')
    .limit(1)
    .single()
  
  const capacity = settings?.capacity || 0
  
  // Count confirmed registrations
  const { count: confirmedCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
  
  // Count waitlist registrations
  const { count: waitlistCount } = await supabase
    .from('challenge_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'waitlist')
  
  const confirmed_count = confirmedCount || 0
  const waitlist_count = waitlistCount || 0
  const remaining = Math.max(capacity - confirmed_count, 0)
  
  return {
    confirmed_count,
    waitlist_count,
    remaining,
    capacity,
  }
}

/**
 * Register for the challenge (calls the RPC function)
 */
export async function registerChallengeAction(formData: FormData): Promise<RegistrationResult> {
  const supabase = getSupabaseAdmin()
  
  const name = formData.get('name') as string
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const phone = formData.get('phone') as string | null
  
  if (!name || !email) {
    return { status: 'error', error: 'الاسم والبريد الإلكتروني مطلوبان' }
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { status: 'error', error: 'صيغة البريد الإلكتروني غير صحيحة' }
  }
  
  try {
    // Call the RPC function
    const { data, error } = await supabase.rpc('register_for_challenge', {
      p_name: name,
      p_email: email,
      p_phone: phone || null,
    })
    
    if (error) {
      console.error('RPC error:', error)
      return { status: 'error', error: 'حدث خطأ أثناء التسجيل' }
    }
    
    // The RPC returns a table with status, registration_id, remaining
    const result = Array.isArray(data) ? data[0] : data
    
    return {
      status: result.status as 'success' | 'full' | 'already_registered',
      registration_id: result.registration_id,
      remaining: result.remaining,
    }
  } catch (err) {
    console.error('Registration error:', err)
    return { status: 'error', error: 'حدث خطأ أثناء التسجيل' }
  }
}

/**
 * Get meeting details for a confirmed registration (secure - only returns URL if confirmed)
 */
export async function getMeetingDetailsAction(registrationId: string): Promise<MeetingDetails | null> {
  const supabase = getSupabaseAdmin()
  
  // Verify the registration exists and is confirmed
  const { data: registration, error: regError } = await supabase
    .from('challenge_registrations')
    .select('status')
    .eq('id', registrationId)
    .single()
  
  if (regError || !registration) {
    console.error('Registration not found:', regError)
    return null
  }
  
  // Only allow meeting URL access for confirmed registrations
  if (registration.status !== 'confirmed') {
    return null
  }
  
  // Get the meeting details from settings
  const { data: settings, error: settingsError } = await supabase
    .from('challenge_settings')
    .select('meeting_url, starts_at, duration_minutes, timezone')
    .limit(1)
    .single()
  
  if (settingsError || !settings) {
    console.error('Settings not found:', settingsError)
    return null
  }
  
  return settings as MeetingDetails
}

/**
 * Get registration by email (for already_registered state)
 */
export async function getRegistrationByEmailAction(email: string): Promise<{ id: string; status: string } | null> {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('challenge_registrations')
    .select('id, status')
    .eq('email', email.toLowerCase().trim())
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

/**
 * Mark that the user copied the meeting link
 */
export async function markLinkCopiedAction(registrationId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  
  const { error } = await supabase
    .from('challenge_registrations')
    .update({ link_copied_at: new Date().toISOString() })
    .eq('id', registrationId)
  
  if (error) {
    console.error('Error marking link as copied:', error)
    return false
  }
  
  return true
}

/**
 * Mark that the user saved the meeting link
 */
export async function markLinkSavedAction(registrationId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  
  const { error } = await supabase
    .from('challenge_registrations')
    .update({ link_saved_at: new Date().toISOString() })
    .eq('id', registrationId)
  
  if (error) {
    console.error('Error marking link as saved:', error)
    return false
  }
  
  return true
}
