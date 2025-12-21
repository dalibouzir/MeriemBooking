/**
 * Meta Library Index
 * Re-export all Meta tracking utilities
 */

export {
  loadPixel,
  trackPageView,
  trackLead as trackLeadPixel,
  trackCustomEvent,
  generateEventId,
  isPixelReady,
  getFbp,
  getFbc,
} from './pixel'

// Unified Lead tracking (Browser + CAPI with deduplication)
export {
  trackLead,
  trackLeadBrowser,
  trackLeadServer,
  type LeadEventPayload,
  type LeadTrackingResult,
} from './lead'

export {
  sendCAPIEvent,
  trackLeadCAPI,
  trackPageViewCAPI,
  type CAPIEventData,
  type CAPIResponse,
} from './capi'

export {
  sha256,
  sha256Sync,
  hashEmail,
  hashPhone,
  hashEmailSync,
  hashPhoneSync,
} from './hash'
