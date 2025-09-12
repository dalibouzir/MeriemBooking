// src/app/layout.tsx
// تخطيط عام للتطبيق: شريط علوي (سَكَن) + روابط عربية (قائمة قابلة للطي على الجوال)

import './globals.css'
import '../styles/globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import Providers from './providers'

// Ensures proper mobile scaling (prevents weird "disappearing" when toggling device mode)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar">
      <body>
        <Providers>
          <header className="topbar">
            <div className="container topbar-row">
              <Link href="/" className="brand" aria-label="الرجوع للصفحة الرئيسية — فطرة الأمهات">
                <img src="/logo/logo.png" alt="فطرة الأمهات" className="brand-logo" />
                <span className="brand-mark">Fittrah Moms </span>
              </Link>

              {/* تمت إزالة روابط التنقل حسب الطلب لواجهة أبسط */}
            </div>
          </header>

          <main id="main" className="page-wrap">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
