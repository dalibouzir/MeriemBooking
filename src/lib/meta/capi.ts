/**
 * Meta Conversions API Client
 * For calling the server-side CAPI endpoint from client
 */

import { getFbp, getFbc, generateEventId } from './pixel'

export interface CAPIEventData {
  event_name: 'Lead' | 'PageView' | 'ViewContent' | 'Purchase' | string
  event_id: string
  email?: string
  phone?: string
  event_source_url?: string
  custom_data?: Record<string, unknown>
}

export interface CAPIResponse {
  success: boolean
  events_received?: number
  error?: string
}

/**
 * Send event to Meta CAPI via our API route
 */
export async function sendCAPIEvent(data: CAPIEventData): Promise<CAPIResponse> {
  try {
    const response = await fetch('/api/meta/capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        event_source_url: data.event_source_url || window.location.href,
        fbp: getFbp(),
        fbc: getFbc(),
        user_agent: navigator.userAgent,
      }),
      keepalive: true,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return { success: false, error: error.error || 'CAPI request failed' }
    }

    return await response.json()
  } catch (error) {
    console.warn('[Meta CAPI] Request failed:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Track Lead via CAPI (server-side)
 * Use same eventId as client-side for deduplication
 */
export async function trackLeadCAPI(
  data: {
    email?: string
    phone?: string
    leadType?: string
    formName?: string
    value?: number
    currency?: string
    contentName?: string
  },
  eventId?: string
): Promise<{ eventId: string; response: CAPIResponse }> {
  const id = eventId || generateEventId()

  const customData: Record<string, unknown> = {}
  if (data.leadType) customData.lead_type = data.leadType
  if (data.formName) customData.form_name = data.formName
  if (data.contentName) customData.content_name = data.contentName
  if (data.value !== undefined) customData.value = data.value
  if (data.currency) customData.currency = data.currency

  const response = await sendCAPIEvent({
    event_name: 'Lead',
    event_id: id,
    email: data.email,
    phone: data.phone,
    custom_data: Object.keys(customData).length > 0 ? customData : undefined,
  })

  return { eventId: id, response }
}

/**
 * Track PageView via CAPI (optional, for server-side redundancy)
 */
export async function trackPageViewCAPI(eventId?: string): Promise<{ eventId: string; response: CAPIResponse }> {
  const id = eventId || generateEventId()

  const response = await sendCAPIEvent({
    event_name: 'PageView',
    event_id: id,
  })

  return { eventId: id, response }
}
