/**
 * Lead Event Tracking Helper
 * Unified interface for Browser (Pixel) + Server (CAPI) Lead tracking
 * 
 * Usage:
 *   import { trackLead } from '@/lib/meta/lead'
 *   
 *   // After successful form submission:
 *   const eventId = await trackLead({
 *     email: formData.email,
 *     phone: formData.phone,
 *     contentName: 'free_booklet',
 *     formName: 'download_form',
 *   })
 */

'use client'

import { generateEventId, trackLead as trackLeadPixel, isPixelReady, getFbp, getFbc } from './pixel'
import { trackLeadCAPI } from './capi'

export interface LeadEventPayload {
  /** User email (will be hashed for CAPI) */
  email?: string
  /** User phone (will be hashed for CAPI) */
  phone?: string
  /** Lead classification (e.g., 'newsletter', 'download', 'challenge') */
  leadType?: string
  /** Form identifier (e.g., 'download_form', 'challenge_modal') */
  formName: string
  /** Content identifier (e.g., 'free_booklet', 'fitness_challenge') */
  contentName: string
  /** Optional value for lead */
  value?: number
  /** Currency code */
  currency?: string
}

export interface LeadTrackingResult {
  /** Unique event ID used for deduplication */
  eventId: string
  /** Whether browser pixel fired successfully */
  browserSent: boolean
  /** Whether CAPI request was sent */
  serverSent: boolean
  /** Error message if any */
  error?: string
}

/**
 * Track Lead event - fires both Browser Pixel and Server CAPI
 * with automatic deduplication via shared event_id
 * 
 * @param payload - Lead event data
 * @returns Tracking result with eventId for verification
 * 
 * @example
 * // After successful Supabase insert or API success:
 * const result = await trackLead({
 *   email: user.email,
 *   phone: user.phone,
 *   formName: 'download_form',
 *   contentName: 'free_booklet',
 * })
 * console.log('Lead tracked:', result.eventId)
 */
export async function trackLead(payload: LeadEventPayload): Promise<LeadTrackingResult> {
  const eventId = generateEventId()
  let browserSent = false
  let serverSent = false
  let error: string | undefined

  // 1) Browser Pixel (synchronous, best-effort)
  try {
    if (isPixelReady()) {
      trackLeadPixel(
        {
          leadType: payload.leadType,
          formName: payload.formName,
          contentName: payload.contentName,
          value: payload.value,
          currency: payload.currency,
        },
        eventId
      )
      browserSent = true
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Lead] Browser Pixel fired', { eventId, formName: payload.formName })
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Lead] Browser Pixel not ready, skipping')
    }
  } catch (err) {
    console.warn('[Lead] Browser Pixel error:', err)
    error = 'Browser tracking failed'
  }

  // 2) Server CAPI (async, best-effort)
  try {
    const capiResult = await trackLeadCAPI(
      {
        email: payload.email,
        phone: payload.phone,
        leadType: payload.leadType,
        formName: payload.formName,
        contentName: payload.contentName,
        value: payload.value,
        currency: payload.currency,
      },
      eventId
    )
    serverSent = capiResult.response.success
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Lead] CAPI result:', capiResult.response)
    }
  } catch (err) {
    console.warn('[Lead] CAPI error:', err)
    error = error ? `${error}; CAPI failed` : 'CAPI tracking failed'
  }

  return {
    eventId,
    browserSent,
    serverSent,
    error,
  }
}

/**
 * Browser-only Lead tracking
 * Use when you only want client-side pixel (no server call)
 */
export function trackLeadBrowser(
  payload: Omit<LeadEventPayload, 'email' | 'phone'>,
  eventId?: string
): string {
  const id = eventId || generateEventId()
  
  if (isPixelReady()) {
    trackLeadPixel(
      {
        leadType: payload.leadType,
        formName: payload.formName,
        contentName: payload.contentName,
        value: payload.value,
        currency: payload.currency,
      },
      id
    )
  }
  
  return id
}

/**
 * Server-only Lead tracking via CAPI
 * Use when you only want server-side tracking
 */
export async function trackLeadServer(
  payload: LeadEventPayload,
  eventId?: string
): Promise<{ eventId: string; success: boolean }> {
  const id = eventId || generateEventId()
  
  try {
    const result = await trackLeadCAPI(
      {
        email: payload.email,
        phone: payload.phone,
        leadType: payload.leadType,
        formName: payload.formName,
        contentName: payload.contentName,
        value: payload.value,
        currency: payload.currency,
      },
      id
    )
    return { eventId: id, success: result.response.success }
  } catch {
    return { eventId: id, success: false }
  }
}

// Re-export for convenience
export { generateEventId, getFbp, getFbc }
