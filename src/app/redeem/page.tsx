'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RedeemPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const redeem = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/call/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Redeem failed')
      return
    }

    // Redirect to free call page with token
    if (data.token) {
      router.push(`/free-call?token=${data.token}`)
    }
  }

  return (
    <div dir="rtl" className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">استبدال الكود</h1>

      <input
        className="w-full border rounded p-2 mb-4"
        placeholder="أدخل الكود هنا"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={redeem}
        disabled={loading || !code}
        className="w-full bg-purple-700 text-white rounded p-2 font-bold disabled:opacity-50"
      >
        {loading ? '...يرجى الانتظار' : 'تأكيد الكود'}
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  )
}
