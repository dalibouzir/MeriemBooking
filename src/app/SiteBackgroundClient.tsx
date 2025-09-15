'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function SiteBackgroundClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const cls = isHome ? 'site-bg--purple' : 'site-bg--image'
  return <div className={cls}>{children}</div>
}

