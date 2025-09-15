// src/app/layout.tsx
// تخطيط عام للتطبيق: شريط علوي (سَكَن) + روابط عربية (قائمة قابلة للطي على الجوال)

import '../styles/globals.css'
import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import Providers from './providers'
export const metadata: Metadata = {
  title: 'Fittrah Moms',
  icons: {
    icon: '/logo/logo.png',
    shortcut: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
}
import TopbarAuth from '@/components/TopbarAuth'

// Ensures proper mobile scaling (prevents weird "disappearing" when toggling device mode)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar">
      <body>
        <div className="site-bg">
          <Providers>
            <header className="topbar">
              <div className="container topbar-row">
                <Link href="/" className="brand" aria-label="الرجوع للصفحة الرئيسية — فطرة الأمهات">
                  <img src="/logo/logo.png" alt="فطرة الأمهات" className="brand-logo" />
                  <span className="brand-mark">Fittrah Moms </span>
                </Link>
                <TopbarAuth />
              </div>
            </header>

            <main id="main" className="page-wrap">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  )
}
