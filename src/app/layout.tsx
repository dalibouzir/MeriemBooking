// src/app/layout.tsx
// تخطيط عام للتطبيق: شريط علوي (سَكَن) + روابط عربية (قائمة قابلة للطي على الجوال)

import '../styles/globals.css'
import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Tajawal } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Providers from './providers'
import SiteBackgroundClient from './SiteBackgroundClient'
import ScrollHideTopbar from '@/components/ScrollHideTopbar'

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
})
export const metadata: Metadata = {
  title: 'Fittrah Moms',
  icons: {
    icon: '/logo/logo.png',
    shortcut: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
  verification: {
    other: {
      'facebook-domain-verification': '0shoddo4oh2njh9bt5ev8lpnem4oz6',
    },
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
    <html dir="rtl" lang="ar" className={`theme-l1 ${tajawal.className}`}>
      <body>
        <SiteBackgroundClient>
          <Providers>
            <ScrollHideTopbar />

            <main id="main" className="page-wrap">
              {children}
            </main>
          </Providers>
        </SiteBackgroundClient>
        <Analytics />
      </body>
    </html>
  )
}
