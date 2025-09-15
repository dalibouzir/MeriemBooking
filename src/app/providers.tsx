"use client"

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import RouteProgress from './RouteProgress'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RouteProgress />
      {children}
    </SessionProvider>
  )
}
