/**
 * Consent Management Utility
 * Simple consent handling for tracking (GDPR/CCPA compliant base)
 */

const CONSENT_COOKIE_NAME = 'fittrah_tracking_consent'
const CONSENT_EXPIRY_DAYS = 365

/**
 * Get current tracking consent status
 */
export function getTrackingConsent(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (!cookie) {
    // Default: assume consent for regions without strict requirements
    // In strict GDPR regions, you should default to false
    return true
  }

  return cookie.split('=')[1] === 'true'
}

/**
 * Set tracking consent
 */
export function setTrackingConsent(consent: boolean): void {
  if (typeof document === 'undefined') {
    return
  }

  const expires = new Date()
  expires.setTime(expires.getTime() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  document.cookie = `${CONSENT_COOKIE_NAME}=${consent}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`

  // Dispatch event for other components to react
  window.dispatchEvent(
    new CustomEvent('tracking-consent-changed', { detail: { consent } })
  )
}

/**
 * Check if consent has been explicitly set (vs default)
 */
export function hasConsentBeenSet(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  return document.cookie
    .split('; ')
    .some((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
}

/**
 * Clear consent (for "withdraw consent" scenarios)
 */
export function clearTrackingConsent(): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`

  window.dispatchEvent(
    new CustomEvent('tracking-consent-changed', { detail: { consent: false } })
  )
}

/**
 * Hook-friendly consent listener
 */
export function onConsentChange(callback: (consent: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ consent: boolean }>
    callback(customEvent.detail.consent)
  }

  window.addEventListener('tracking-consent-changed', handler)
  return () => window.removeEventListener('tracking-consent-changed', handler)
}
