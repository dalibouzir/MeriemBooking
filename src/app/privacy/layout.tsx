import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية لموقع فطرة الأمهات — كيف نجمع ونستخدم ونحمي بياناتك الشخصية.',
  alternates: {
    canonical: 'https://www.fittrahmoms.com/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
