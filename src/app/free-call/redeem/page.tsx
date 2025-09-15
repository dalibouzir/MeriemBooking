import { Suspense } from 'react'
import FreeCallRedeemClient from './FreeCallRedeemClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={
      <section dir="rtl" className="main-container" style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
          <h1 className="text-2xl font-bold mb-2">تأكيد الكود</h1>
          <p className="text-sm text-gray-600">جارٍ التحميل…</p>
        </div>
      </section>
    }>
      <FreeCallRedeemClient />
    </Suspense>
  )
}
