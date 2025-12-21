'use client'

/**
 * PixelTracker Component
 * Handles SPA-safe PageView tracking on route changes
 * Must be used inside PixelProvider
 */

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView, isPixelReady } from '@/lib/meta/pixel'

interface PixelTrackerProps {
  /** Enable debug logging */
  debug?: boolean
}

export default function PixelTracker({ debug = false }: PixelTrackerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Track last fired URL to prevent duplicates (persists across Strict Mode remounts)
  const lastTrackedUrl = useRef<string | null>(null)
  const isTracking = useRef(false)

  useEffect(() => {
    // Build current URL
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Prevent duplicate fires for same URL (handles React Strict Mode)
    if (lastTrackedUrl.current === url || isTracking.current) {
      if (debug) {
        console.log('[PixelTracker] Skipping duplicate PageView for:', url)
      }
      return
    }

    isTracking.current = true

    // Retry mechanism for pixel readiness
    let attempts = 0
    const maxAttempts = 20
    const interval = 100
    let timeoutId: NodeJS.Timeout

    const tryTrackPageView = () => {
      attempts++
      
      if (isPixelReady()) {
        trackPageView(url)
        lastTrackedUrl.current = url
        isTracking.current = false
        
        if (debug) {
          console.log('[PixelTracker] PageView tracked:', url, 'after', attempts, 'attempts')
        }
        return
      }
      
      if (attempts < maxAttempts) {
        timeoutId = setTimeout(tryTrackPageView, interval)
      } else {
        isTracking.current = false
        if (debug) {
          console.log('[PixelTracker] Pixel not ready after', maxAttempts, 'attempts, skipping:', url)
        }
      }
    }

    // Small initial delay to let pixel initialize
    timeoutId = setTimeout(tryTrackPageView, 50)

    return () => {
      clearTimeout(timeoutId)
      isTracking.current = false
    }
  }, [pathname, searchParams, debug])

  // This component renders nothing
  return null
}
