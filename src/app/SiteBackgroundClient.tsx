'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function SiteBackgroundClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isChallenge = pathname === '/challenge'
  
  // Challenge page has its own background, don't apply site background
  if (isChallenge) {
    return <>{children}</>
  }
  
  const cls = isHome ? 'site-bg--purple' : 'site-bg--image'
  return <div className={cls}>{children}</div>
}

