import { Suspense } from 'react'

import RedeemClient from './RedeemClient'

function RedeemFallback() {
  return (
    <section id="redeem" dir="rtl" className="rd-section">
      <div className="rd-card glass-water">
        <h1 className="rd-title">استبدال الكود</h1>
        <p className="rd-sub">جارٍ تحميل الاستمارة...</p>
      </div>
    </section>
  )
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<RedeemFallback />}>
      <RedeemClient />
    </Suspense>
  )
}
