"use client"

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import ChatbotWidget from '@/components/ChatbotWidget'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ChatbotWidget />
    </SessionProvider>
  )
}
