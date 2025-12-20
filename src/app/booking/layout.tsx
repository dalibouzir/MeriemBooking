import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'احجزي جلستك | جلسة إرشاد فردية',
  description: 'احجزي جلسة إرشاد فردية نحو الاتزان العاطفي مع مريم بوزير. جلسة هادئة وعميقة مدّتها ساعة كاملة لفهم مشاعرك واستعادة توازنك الداخلي.',
  alternates: {
    canonical: 'https://www.fittrahmoms.com/booking',
  },
  openGraph: {
    title: 'احجزي جلستك | Fittrah Moms',
    description: 'جلسة إرشاد فردية نحو الاتزان العاطفي — مساحة آمنة لفهم مشاعرك واستعادة توازنك.',
    url: 'https://www.fittrahmoms.com/booking',
    type: 'website',
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
