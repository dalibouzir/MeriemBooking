'use client'

/**
 * PixelProvider Component
 * Initializes Meta Pixel once globally with consent handling
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { Suspense } from 'react'
import { loadPixel, isPixelReady, trackLead, generateEventId } from '@/lib/meta/pixel'
import { trackLeadCAPI } from '@/lib/meta/capi'
import { getTrackingConsent, onConsentChange } from '@/lib/consent'
import PixelTracker from '@/components/analytics/PixelTracker'

interface MetaTrackingContextValue {
  /** Whether tracking is ready (pixel loaded + consent granted) */
  isReady: boolean
  /** Current consent status */
  hasConsent: boolean
  /**
   * Track a Lead event with automatic deduplication
   * Fires both client-side Pixel and server-side CAPI
   */
  trackLeadEvent: (data: {
    email?: string
    phone?: string
    leadType?: string
    formName?: string
    value?: number
    currency?: string
    contentName?: string
  }) => Promise<string>
}

const MetaTrackingContext = createContext<MetaTrackingContextValue>({
  isReady: false,
  hasConsent: false,
  trackLeadEvent: async () => '',
})

/**
 * Hook to access Meta tracking functions
 */
export function useMetaTracking() {
  return useContext(MetaTrackingContext)
}

interface PixelProviderProps {
  children: ReactNode
  /** Enable debug mode */
  debug?: boolean
}

export default function PixelProvider({ children, debug = false }: PixelProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize pixel on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    
    // Force consent to true for testing - remove in production if you need strict consent
    const consent = getTrackingConsent()
    setHasConsent(consent)

    if (debug) {
      console.log('[PixelProvider] Mounting, consent:', consent)
    }

    if (consent) {
      loadPixel(true).then(() => {
        const ready = isPixelReady()
        setIsReady(ready)
        if (debug) {
          console.log('[PixelProvider] Pixel loaded, ready:', ready)
        }
      })
    } else if (debug) {
      console.log('[PixelProvider] No consent, pixel not loaded')
    }

    // Listen for consent changes
    const unsubscribe = onConsentChange((newConsent) => {
      setHasConsent(newConsent)
      if (newConsent) {
        loadPixel(true).then(() => {
          setIsReady(isPixelReady())
        })
      }
    })

    return unsubscribe
  }, [debug]) // Removed isReady from deps to prevent re-render loop

  // Track Lead with deduplication (same eventId for Pixel + CAPI)
  const trackLeadEvent = useCallback(
    async (data: {
      email?: string
      phone?: string
      leadType?: string
      formName?: string
      value?: number
      currency?: string
      contentName?: string
    }): Promise<string> => {
      // Generate single eventId for deduplication
      const eventId = generateEventId()

      if (!hasConsent) {
        if (debug) {
          console.log('[PixelProvider] No consent, skipping Lead tracking')
        }
        return eventId
      }

      // 1) Client-side Pixel
      trackLead(
        {
          leadType: data.leadType,
          formName: data.formName,
          value: data.value,
          currency: data.currency,
          contentName: data.contentName,
        },
        eventId
      )

      // 2) Server-side CAPI (same eventId for deduplication)
      try {
        await trackLeadCAPI(
          {
            email: data.email,
            phone: data.phone,
            leadType: data.leadType,
            formName: data.formName,
            value: data.value,
            currency: data.currency,
            contentName: data.contentName,
          },
          eventId
        )
      } catch (error) {
        if (debug) {
          console.warn('[PixelProvider] CAPI Lead tracking failed:', error)
        }
      }

      if (debug) {
        console.log('[PixelProvider] Lead tracked with eventId:', eventId)
      }

      return eventId
    },
    [hasConsent, debug]
  )

  const contextValue: MetaTrackingContextValue = {
    isReady,
    hasConsent,
    trackLeadEvent,
  }

  return (
    <MetaTrackingContext.Provider value={contextValue}>
      {children}
      {/* PixelTracker handles PageView on route changes */}
      {hasConsent && (
        <Suspense fallback={null}>
          <PixelTracker debug={debug} />
        </Suspense>
      )}
    </MetaTrackingContext.Provider>
  )
}
