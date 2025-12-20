import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام لموقع فطرة الأمهات — قواعد استخدام الموقع والخدمات المُقدَّمة.',
  alternates: {
    canonical: 'https://www.fittrahmoms.com/policy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
