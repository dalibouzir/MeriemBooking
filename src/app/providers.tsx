"use client"

import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import RouteProgress from './RouteProgress'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      {children}
    </SessionProvider>
  )
}
