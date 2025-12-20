import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'البرنامج التدريبي | Fittrah Moms',
  description: 'برنامج تدريبي متكامل يعيدك لسلامك الداخلي — قريبًا من فطرة الأمهات.',
  alternates: {
    canonical: 'https://www.fittrahmoms.com/train-program',
  },
  openGraph: {
    title: 'البرنامج التدريبي | Fittrah Moms',
    description: 'برنامج تدريبي متكامل يعيدك لسلامك الداخلي — قريبًا من فطرة الأمهات.',
    url: 'https://www.fittrahmoms.com/train-program',
  },
}

export default function TrainProgramPage() {
  return (
    <main className="train-program" dir="rtl">
      <section className="train-program-hero is-minimal">
        <div>
          <p className="train-program-kicker">بـرنـامـج تـدريـبـي</p>
          <h1>قريبًا سنكشف عن برنامج تدريبي متكامل يعيدك لسلامك الداخلي.</h1>
          <p className="train-program-subtitle">
            الصفحة قيد التطوير. اشتركي عبر الدردشة أو البريد لتتوصلي بأحدث الأخبار فور الإطلاق.
          </p>
          <div className="train-program-status">Coming Soon</div>
        </div>
      </section>
    </main>
  )
}
