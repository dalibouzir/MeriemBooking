"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FreeCallRedeemClient() {
  const search = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const token = (search?.get('token') || '').trim().toUpperCase()

  useEffect(() => {
    async function run() {
      if (!token) return
      try {
        const res = await fetch('/api/call/redeem', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: token })
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || !j?.token) {
          setError(j?.error || 'تعذّر تأكيد الكود.')
          return
        }
        router.replace(`/free-call?token=${encodeURIComponent(j.token)}`)
      } catch {
        setError('حدث خطأ غير متوقع.')
      }
    }
    run()
  }, [token, router])

  return (
    <section dir="rtl" className="main-container" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
        <h1 className="text-2xl font-bold mb-2">تأكيد الكود</h1>
        {!token && <p className="text-sm text-gray-600">لا يوجد كود في الرابط.</p>}
        {token && !error && <p className="text-sm text-gray-600">جارٍ التأكيد…</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
      </div>
    </section>
  )
}

