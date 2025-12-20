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
  preload: true,
})

const siteUrl = 'https://www.fittrahmoms.com'
const siteName = 'Fittrah Moms | فطرة الأمهات'
const siteDescription = 'منصّة تُساعد المرأة على استعادة أنوثتها وفطرتها لتعيش علاقاتٍ صحّية، وبيتًا أهدأ، ومجتمعًا أكثر اتّزانًا. إرشاد عاطفي وجلسات دعم للأمهات.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: '%s | Fittrah Moms',
  },
  description: siteDescription,
  keywords: ['فطرة الأمهات', 'إرشاد عاطفي', 'دعم الأمهات', 'جلسات إرشادية', 'مريم بوزير', 'الاتزان العاطفي', 'العلاقات الأسرية'],
  authors: [{ name: 'مريم بوزير', url: siteUrl }],
  creator: 'مريم بوزير',
  publisher: 'Fittrah Moms',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/logo/logo.png`,
        width: 800,
        height: 600,
        alt: 'Fittrah Moms - فطرة الأمهات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [`${siteUrl}/logo/logo.png`],
  },
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
  themeColor: '#8b5cf6',
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Fittrah Moms',
      alternateName: 'فطرة الأمهات',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo/logo.png`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'meriembouzir05@gmail.com',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'French'],
      },
      sameAs: [
        'https://www.instagram.com/fittrah.moms',
        'https://www.youtube.com/@fittrahmoms',
        'https://linktr.ee/meriembouzir',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'ar',
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: 'مريم بوزير',
      alternateName: 'Meriem Bouzir',
      jobTitle: 'مرشدة في الاتزان العاطفي والعلاقات',
      description: 'مرشدة في الاتزان العاطفي والعلاقات، أمّ لطفلتين، تونسية تتنقّل بين تونس وفرنسا.',
      url: siteUrl,
      sameAs: [
        'https://www.instagram.com/fittrah.moms',
        'https://www.youtube.com/@fittrahmoms',
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html dir="rtl" lang="ar" className={`theme-l1 ${tajawal.className}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
