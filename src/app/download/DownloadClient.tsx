"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type RequestDownloadResponse = {
  ok?: boolean
  token?: string
  error?: string
  message?: string
  redeemUrl?: string
  downloadUrl?: string
}

const SUCCESS_VIDEO_URL = (process.env.NEXT_PUBLIC_SUCCESS_VIDEO_URL || '').trim()
const SUCCESS_CALL_URL = (process.env.NEXT_PUBLIC_SUCCESS_CALL_BOOKING_URL || 'https://calendly.com/meriembouzir/30min').trim()
const SUCCESS_SUPPORT_TEXT = (process.env.NEXT_PUBLIC_SUCCESS_SUPPORT_TEXT || 'اطمئني، أرسلنا لك كل التفاصيل عبر الإيميل والواتساب. إذا لم تصلك الرسالة خلال دقائق راسلينا على واتساب.').trim()
const SUCCESS_CTA_LABEL = (process.env.NEXT_PUBLIC_SUCCESS_CTA_LABEL || 'احجز مكالمتك المجانية الآن').trim()

export default function DownloadClient({ initialProduct = '' }: { initialProduct?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const product = initialProduct
  const hpRef = useRef<HTMLInputElement | null>(null)

  const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  const productMissing = useMemo(() => !product, [product])

  useEffect(() => {
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
      const formEl = e.currentTarget
      const fd = new FormData(formEl)
      if ((hpRef.current?.value || '').trim() !== '') throw new Error('Spam detected')

      const firstName = String(fd.get('first_name') || '').trim()
      const lastName = String(fd.get('last_name') || '').trim()
      const email = String(fd.get('email') || '').trim()
      const phone = String(fd.get('phone') || '').trim()

      if (!firstName) throw new Error('الاسم مطلوب')
      if (!lastName) throw new Error('اللقب مطلوب')
      if (!isValidEmail(email)) throw new Error('البريد الإلكتروني غير صالح')
      if (!phone) throw new Error('رقم الهاتف مطلوب')
      if (!product) throw new Error('المنتج غير محدد')

      const res = await fetch('/api/request-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          product,
          phone,
        }),
      })

      const data: RequestDownloadResponse = await res.json().catch(() => ({} as RequestDownloadResponse))

      if (!res.ok) {
        const msg = data.error || data.message || 'تعذّر الإرسال، حاول/ي مجددًا.'
        setError(msg)
        return
      }

      const token = (data.token || '').trim()
      const redeemUrl = (data.redeemUrl || '').trim()
      if (!token) {
        setError('تم الإرسال لكن تعذّر الحصول على رمز المكالمة. تواصلي مع الدعم لو استمرّت المشكلة.')
        return
      }

      formEl.reset()
      setMessage('📩 تم إرسال رسالة التأكيد إلى بريدك الإلكتروني. جارٍ تحويلك لصفحة التأكيد...')

      const params = new URLSearchParams()
      params.set('locale', 'ar')
      params.set('customerName', firstName)
      if (SUCCESS_VIDEO_URL) params.set('videoUrl', SUCCESS_VIDEO_URL)
      const bookingUrl = redeemUrl || SUCCESS_CALL_URL
      if (bookingUrl) params.set('callBookingUrl', bookingUrl)
      params.set('callCode', `code=${token}`)
      if (SUCCESS_SUPPORT_TEXT) params.set('supportText', SUCCESS_SUPPORT_TEXT)
      if (SUCCESS_CTA_LABEL) params.set('ctaLabel', SUCCESS_CTA_LABEL)

      const successUrl = `/success?${params.toString()}`
      router.push(successUrl)
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

        <div className="dl-name-group">
          <input name="first_name" required className="dl-input" placeholder="الإسم" />
          <input name="last_name" required className="dl-input" placeholder="اللقب" />
        </div>
        <input name="email" type="email" inputMode="email" required className="dl-input" placeholder="البريد الإلكتروني" />
        <input name="phone" type="tel" inputMode="tel" required className="dl-input" placeholder="رقم الهاتف" />

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
          </div>
        )}

        {!productMissing && (
          <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.75rem' }}>
            ⚠️ تذكير: قد يظهر البريد أحيانًا في مجلد &quot;Spam&quot; أو &quot;Promotions&quot;، يرجى التحقق هناك إذا لم يصلك في غضون دقائق.
          </p>
        )}
      </form>

      <style jsx global>{`
        .dl-form {
          display: grid;
          gap: 12px;
        }

        .dl-name-group {
          display: grid;
          gap: 10px;
        }

        @media (min-width: 540px) {
          .dl-name-group {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
      </div>
    </section>
  )
}
