/**
 * Meta Pixel Client-Side Implementation
 * Production-grade with consent gating and SPA support
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2652858771748544'

// Type declarations for fbq
declare global {
  interface Window {
    fbq: Fbq
    _fbq?: Fbq
  }
}

type FbqEvent = 'PageView' | 'Lead' | 'ViewContent' | 'Search' | 'AddToCart' | 'Purchase' | 'CompleteRegistration' | string

interface FbqOptions {
  eventID?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Fbq {
  (...args: any[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: (...args: unknown[]) => void
  loaded: boolean
  version: string
}

// State tracking
let pixelLoaded = false
let pixelInitialized = false
let consentGranted = false

/**
 * Generate a unique event ID for deduplication
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}_${random}`
}

/**
 * Check if pixel is ready for tracking
 */
export function isPixelReady(): boolean {
  return pixelLoaded && pixelInitialized && consentGranted && typeof window !== 'undefined' && typeof window.fbq === 'function'
}

/**
 * Load Meta Pixel script dynamically
 * Only loads once, respects consent
 */
export async function loadPixel(consent: boolean): Promise<void> {
  consentGranted = consent

  // Skip if no consent or already loaded
  if (!consent || pixelLoaded || typeof window === 'undefined') {
    return
  }

  return new Promise((resolve) => {
    // Initialize fbq queue before script loads
    const fbq = (window.fbq = window.fbq || function (...args: unknown[]) {
      if ((window.fbq as Fbq).callMethod) {
        (window.fbq as Fbq).callMethod!(...args)
      } else {
        (window.fbq as Fbq).queue.push(args)
      }
    }) as Fbq

    if (!window._fbq) {
      window._fbq = fbq
    }

    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = fbq.queue || []

    // Create and inject script
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    
    script.onload = () => {
      pixelLoaded = true
      
      // Initialize pixel
      if (!pixelInitialized && typeof window.fbq === 'function') {
        window.fbq('init', PIXEL_ID)
        pixelInitialized = true
      }
      
      resolve()
    }

    script.onerror = () => {
      console.warn('[Meta Pixel] Failed to load fbevents.js')
      resolve()
    }

    const firstScript = document.getElementsByTagName('script')[0]
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.head.appendChild(script)
    }
  })
}

/**
 * Track PageView event
 * Safe to call multiple times (SPA navigation)
 */
export function trackPageView(url?: string): void {
  if (!isPixelReady()) {
    return
  }

  try {
    // Standard PageView
    window.fbq('track', 'PageView')
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta Pixel] PageView tracked', url || window.location.href)
    }
  } catch (error) {
    console.warn('[Meta Pixel] PageView tracking failed:', error)
  }
}

/**
 * Track Lead event with deduplication
 * Returns the eventId used (generate if not provided)
 */
export function trackLead(
  data: {
    leadType?: string
    formName?: string
    value?: number
    currency?: string
    contentName?: string
  } = {},
  eventId?: string
): string {
  const id = eventId || generateEventId()

  if (!isPixelReady()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta Pixel] Lead not tracked (pixel not ready)', { data, eventId: id })
    }
    return id
  }

  try {
    const payload: Record<string, unknown> = {}
    
    if (data.leadType) payload.lead_type = data.leadType
    if (data.formName) payload.form_name = data.formName
    if (data.contentName) payload.content_name = data.contentName
    if (data.value !== undefined) payload.value = data.value
    if (data.currency) payload.currency = data.currency

    window.fbq('track', 'Lead', payload, { eventID: id })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta Pixel] Lead tracked', { payload, eventId: id })
    }
  } catch (error) {
    console.warn('[Meta Pixel] Lead tracking failed:', error)
  }

  return id
}

/**
 * Track custom events
 */
export function trackCustomEvent(
  eventName: string,
  data: Record<string, unknown> = {},
  eventId?: string
): string {
  const id = eventId || generateEventId()

  if (!isPixelReady()) {
    return id
  }

  try {
    window.fbq('trackCustom', eventName, data, { eventID: id })
  } catch (error) {
    console.warn('[Meta Pixel] Custom event tracking failed:', error)
  }

  return id
}

/**
 * Get Facebook browser ID (_fbp cookie)
 */
export function getFbp(): string | null {
  if (typeof document === 'undefined') return null
  
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Get Facebook click ID (_fbc cookie or URL param)
 */
export function getFbc(): string | null {
  if (typeof window === 'undefined') return null
  
  // Check URL param first
  const urlParams = new URLSearchParams(window.location.search)
  const fbclid = urlParams.get('fbclid')
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`
  }
  
  // Then check cookie
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)
  return match ? match[1] : null
}
