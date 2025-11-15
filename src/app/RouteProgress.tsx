"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const LOADER_SEGMENTS = Array.from({ length: 9 })
const FLOWER_PETALS = Array.from({ length: 8 })

export default function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()?.toString() || ''
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Show progress briefly on any route or query change
    setVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 600)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname, search])

  return (
    <div
      className={`route-progress${visible ? ' is-visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">
        {visible ? 'جاري تحميل الصفحة' : 'تم تحميل الصفحة'}
      </span>
      <div className="loader" aria-hidden="true">
        <div className="flower" aria-hidden="true">
          {FLOWER_PETALS.map((_, index) => (
            <div className={`petal petal${index + 1}`} key={index} />
          ))}
          <div className="center" />
        </div>
        <div className="loader-text">
          {LOADER_SEGMENTS.map((_, index) => (
            <div className="text" key={index}>
              <span>تحميل</span>
            </div>
          ))}
        </div>
        <div className="line" />
      </div>
    </div>
  )
}
