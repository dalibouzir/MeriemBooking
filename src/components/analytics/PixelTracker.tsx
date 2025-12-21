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
  
  // Track if initial page view has been fired
  const initialPageViewFired = useRef(false)

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

    // Wait a tick for pixel to be ready on initial load
    const timeout = setTimeout(() => {
      if (isPixelReady()) {
        trackPageView(url)
        lastTrackedUrl.current = url
        initialPageViewFired.current = true
        
        if (debug) {
          console.log('[PixelTracker] PageView tracked:', url)
        }
      } else if (debug) {
        console.log('[PixelTracker] Pixel not ready, skipping PageView for:', url)
      }
    }, initialPageViewFired.current ? 0 : 100)

    return () => clearTimeout(timeout)
  }, [pathname, searchParams, debug])

  // This component renders nothing
  return null
}
