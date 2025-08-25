'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function DownloadPage() {
  const sp = useSearchParams()
  const product = sp.get('product') || ''

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Honeypot to catch bots
  const hpRef = useRef<HTMLInputElement | null>(null)

  // Simple email validator
  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

  const productMissing = useMemo(() => !product, [product])

  useEffect(() => {
    // Clear messages whenever product changes
    setMessage(null)
    setError(null)
  }, [product])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const fd = new FormData(e.currentTarget)
      // honeypot check
      if ((hpRef.current?.value || '').trim() !== '') {
        throw new Error('Spam detected')
      }

      const name = String(fd.get('name') || '').trim()
      const email = String(fd.get('email') || '').trim()
      const country = String(fd.get('country') || '').trim()

      if (!name) throw new Error('الاسم مطلوب')
      if (!isValidEmail(email)) throw new Error('البريد الإلكتروني غير صالح')
      if (!product) throw new Error('المنتج غير محدد')

      const res = await fetch('/api/request-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, country, product }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Try to surface a friendly error if it came from Resend test mode
        const msg: string =
          data?.error ||
          data?.message ||
          'تعذّر الإرسال، حاول/ي مجددًا.'

        // Extra hint for Resend testing restriction
        if (typeof msg === 'string' && msg.includes('Resend error') && msg.includes('only send testing emails')) {
          setError('وضع الاختبار في Resend يسمح بإرسال الرسائل فقط إلى بريدك المسجّل في Resend. جرّب نفس بريدك أو فعّل نطاق الإرسال.')
        } else {
          setError(msg)
        }
        return
      }

      setMessage('تم إرسال رسالة التأكيد إلى بريدك الإلكتروني. تفقد البريد الوارد/الغير هام.')
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err?.message || 'تعذّر الإرسال، حاول/ي مجددًا.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">تحميل المنتج</h1>

      {productMissing ? (
        <p className="text-sm text-red-600">
          الصفحة تتطلب تحديد منتج. الرجاء العودة للاستاند/المتجر واختيار المنتج ثم الضغط على «تحميل».
        </p>
      ) : (
        <p className="text-sm opacity-80">
          الرجاء إدخال معلوماتك. سنرسل لك إيميل فيه رابط التحميل + كود مكالمة مجانية صالح 30 يوم.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4" aria-disabled={loading}>
        <input type="hidden" name="product" value={product} />

        {/* Honeypot (hidden from users) */}
        <input
          ref={hpRef}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="space-y-1">
          <label className="block text-sm">الإسم الكامل</label>
          <input
            name="name"
            required
            className="w-full border rounded-lg p-2"
            placeholder="مثال: مريم بن..."
            disabled={loading || productMissing}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            inputMode="email"
            required
            className="w-full border rounded-lg p-2"
            placeholder="you@example.com"
            disabled={loading || productMissing}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm">الدولة (اختياري)</label>
          <input
            name="country"
            className="w-full border rounded-lg p-2"
            placeholder="Tunisia"
            disabled={loading || productMissing}
          />
        </div>

        {/* Placeholder للكابتشا */}
        <div className="space-y-1">
          <label className="block text-sm">التحقق (Captcha)</label>
          <input
            name="captcha_token"
            className="w-full border rounded-lg p-2"
            placeholder="(اختياري الآن)"
            disabled={loading || productMissing}
          />
        </div>

        <button
          type="submit"
          disabled={loading || productMissing}
          className="w-full rounded-xl p-3 bg-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'يرجى الإنتظار…' : 'إرسال وإستلام رابط التحميل'}
        </button>

        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  )
}
