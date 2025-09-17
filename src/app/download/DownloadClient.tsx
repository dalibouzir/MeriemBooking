"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type ApiError = { error?: string; message?: string }

export default function DownloadClient({ initialProduct = '' }: { initialProduct?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectIn, setRedirectIn] = useState<number | null>(null)
  const countdownRef = useRef<number | null>(null)

  const product = initialProduct
  const hpRef = useRef<HTMLInputElement | null>(null)

  const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  const productMissing = useMemo(() => !product, [product])

  useEffect(() => {
    setMessage(null)
    setError(null)
    setRedirectIn(null)
  }, [product])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const formEl = e.currentTarget
      const fd = new FormData(formEl)
      if ((hpRef.current?.value || '').trim() !== '') throw new Error('Spam detected')

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

      const data: ApiError = await res.json().catch(() => ({} as ApiError))

      if (!res.ok) {
        const msg = data.error || data.message || 'تعذّر الإرسال، حاول/ي مجددًا.'
        setError(msg)
        return
      }

      setMessage('📩 تم إرسال رسالة التأكيد إلى بريدك الإلكتروني. تفقد البريد الوارد/الغير هام.')
      formEl.reset()
      // Start a 10s countdown then redirect to /redeem so user can paste the code
      const total = 10
      setRedirectIn(total)
      countdownRef.current = window.setInterval(() => {
        setRedirectIn((prev) => {
          const next = (prev ?? total) - 1
          if (next <= 0) {
            if (countdownRef.current) window.clearInterval(countdownRef.current)
            router.push('/redeem')
            return 0
          }
          return next
        })
      }, 1000)
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'تعذّر الإرسال، حاول/ي مجددًا.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section dir="rtl" className="dl-section">
      <div className="dl-card glass-water">
        <h1 className="dl-title">تحميل المنتج</h1>

        {productMissing ? (
          <p className="dl-warn">
            الصفحة تتطلب تحديد منتج. الرجاء العودة للمتجر واختيار المنتج ثم الضغط على «تحميل».
          </p>
        ) : (
          <p className="dl-sub">
            الرجاء إدخال معلوماتك أدناه. فور الإرسال ستصلك رسالة تأكيد تحتوي على:
            <br />- 🔗 رابط مباشر لتحميل المنتج<br />- 🎁 كود مكالمة مجانية صالح لمدة 30 يوم
          </p>
        )}

      <form id="dl-form" onSubmit={onSubmit} className="dl-form" noValidate>
        <input type="hidden" name="product" value={product} />
        {/* Honeypot */}
        <input ref={hpRef} name="website" tabIndex={-1} autoComplete="off" className="dl-hp" />

        <input name="name" required className="dl-input" placeholder="الإسم الكامل" />
        <input name="email" type="email" inputMode="email" required className="dl-input" placeholder="البريد الإلكتروني" />
        <input name="country" className="dl-input" placeholder="الدولة (اختياري)" />
        <input name="captcha_token" className="dl-input" placeholder="التحقق (اختياري)" />

        <button type="submit" className="dl-btn" disabled={loading || productMissing}>
          {loading ? '⏳ يرجى الإنتظار…' : 'إرسال واستلام رابط التحميل'}
        </button>

        {error && (
          <p className="alert alert-danger" role="alert" style={{ marginTop: '10px' }}>
            {error}
          </p>
        )}
        {message && (
          <div className="alert alert-success" role="status" style={{ marginTop: '10px' }}>
            <p>{message}</p>
            <p style={{ marginTop: 6 }}>
              سنحوّلك الآن لصفحة إدخال الكود لاستبداله
              {typeof redirectIn === 'number' ? ` خلال ${redirectIn} ثانية` : ''}
              — أو <a href="/redeem" className="link">اذهب الآن</a>.
            </p>
          </div>
        )}

        {!productMissing && (
          <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.75rem' }}>
            ⚠️ تذكير: قد يظهر البريد أحيانًا في مجلد &quot;Spam&quot; أو &quot;Promotions&quot;، يرجى التحقق هناك إذا لم يصلك في غضون دقائق.
          </p>
        )}
      </form>

      <style jsx global>{`
        /* place your .dl-* CSS هنا إن لزم */
      `}</style>
      </div>
    </section>
  )
}
