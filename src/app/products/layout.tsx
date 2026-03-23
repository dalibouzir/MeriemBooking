import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'المكتبة | ملفات ومواد تعليمية مجانية',
  description: 'استكشفي مكتبة فطرة النساء — ملفات ومواد تعليمية مجانية للنساء حول الاتزان العاطفي، العلاقات الأسرية، والأنوثة.',
  alternates: {
    canonical: 'https://www.fittrahmoms.com/products',
  },
  openGraph: {
    title: 'المكتبة | Fittrah Women',
    description: 'ملفات ومواد تعليمية مجانية للأمهات — دليلك لاستعادة الهدوء والتوازن.',
    url: 'https://www.fittrahmoms.com/products',
    type: 'website',
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
