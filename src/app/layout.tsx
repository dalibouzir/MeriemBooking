// src/app/layout.tsx
// تخطيط عام للتطبيق: شريط علوي (سَكَن) + روابط عربية (قائمة قابلة للطي على الجوال)

import '../styles/globals.css'
import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Providers from './providers'
import SiteBackgroundClient from './SiteBackgroundClient'
import ScrollHideTopbar from '@/components/ScrollHideTopbar'
export const metadata: Metadata = {
  title: 'Fittrah Moms',
  icons: {
    icon: '/logo/logo.png',
    shortcut: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
}

// Ensures proper mobile scaling (prevents weird "disappearing" when toggling device mode)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar" className="theme-l1">
      <body>
        <SiteBackgroundClient>
          <Providers>
            <ScrollHideTopbar />

            <main id="main" className="page-wrap">
              {children}
            </main>
          </Providers>
        </SiteBackgroundClient>
      </body>
    </html>
  )
}
