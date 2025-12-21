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
  
  // Track last fired URL to prevent duplicates
  const lastTrackedUrl = useRef<string | null>(null)

  useEffect(() => {
    // Build current URL
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Prevent duplicate fires for same URL
    if (lastTrackedUrl.current === url) {
      if (debug) {
        console.log('[PixelTracker] Skipping duplicate PageView for:', url)
      }
      return
    }

    // Retry mechanism for pixel readiness
    let attempts = 0
    const maxAttempts = 20
    const interval = 100

    const tryTrackPageView = () => {
      attempts++
      
      if (isPixelReady()) {
        trackPageView(url)
        lastTrackedUrl.current = url
        
        if (debug) {
          console.log('[PixelTracker] PageView tracked:', url, 'after', attempts, 'attempts')
        }
        return true
      }
      
      if (attempts < maxAttempts) {
        setTimeout(tryTrackPageView, interval)
      } else if (debug) {
        console.log('[PixelTracker] Pixel not ready after', maxAttempts, 'attempts, skipping:', url)
      }
      
      return false
    }

    // Small initial delay to let pixel initialize
    setTimeout(tryTrackPageView, 50)
  }, [pathname, searchParams, debug])

  // This component renders nothing
  return null
}
