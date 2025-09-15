"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

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
      aria-hidden
      className={`route-progress${visible ? ' is-visible' : ''}`}
    />
  )
}
