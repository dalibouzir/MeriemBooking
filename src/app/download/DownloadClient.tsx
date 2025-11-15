"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY_DIAL_CODES } from '@/data/countryDialCodes'

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
const DEFAULT_COUNTRY_CODE = '+33'

const isoToFlag = (iso?: string): string => {
  if (!iso) return ''
  return iso
    .toUpperCase()
    .replace(/[A-Z]/g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
}

export default function DownloadClient({ initialProduct = '' }: { initialProduct?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const product = initialProduct
  const hpRef = useRef<HTMLInputElement | null>(null)

  const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  const productMissing = useMemo(() => !product, [product])
  const countryCodeOptions = useMemo(
    () =>
      COUNTRY_DIAL_CODES.map((entry) => {
        const flag = isoToFlag(entry.iso)
        const label = `${flag ? `${flag} ` : ''}${entry.country} (${entry.code})`
        return {
          code: entry.code,
          label,
          country: entry.country,
        }
      }),
    []
  )

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
      const phoneCode = String(fd.get('country_code') || '').trim() || DEFAULT_COUNTRY_CODE
      const phone = String(fd.get('phone') || '').trim()
      const fullPhone = `${phoneCode} ${phone}`.trim()

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
          phone: fullPhone,
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
            <div className="dl-field">
              <label htmlFor="dl-first-name" className="dl-label">الاسم</label>
              <input id="dl-first-name" name="first_name" required className="dl-input" autoComplete="given-name" />
            </div>
            <div className="dl-field">
              <label htmlFor="dl-last-name" className="dl-label">اللقب</label>
              <input id="dl-last-name" name="last_name" required className="dl-input" autoComplete="family-name" />
            </div>
          </div>

          <div className="dl-field">
            <label htmlFor="dl-email" className="dl-label">البريد الإلكتروني</label>
            <input
              id="dl-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className="dl-input"
              dir="ltr"
            />
          </div>

          <div className="dl-field">
            <label htmlFor="dl-phone" className="dl-label">رقم الهاتف / واتساب</label>
            <div className="dl-phone-group">
              <label className="sr-only" htmlFor="country_code">
                رمز الدولة
              </label>
              <select
                id="country_code"
                name="country_code"
                required
                className="dl-input dl-input-code dl-select"
                defaultValue={DEFAULT_COUNTRY_CODE}
              >
                {countryCodeOptions.map((option) => (
                  <option key={`${option.country}-${option.code}`} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                id="dl-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                className="dl-input dl-input-phone"
                placeholder="5x xxx xxxx"
                dir="ltr"
              />
            </div>
          </div>

          <button type="submit" className="dl-btn" disabled={loading || productMissing}>
            {loading ? '⏳ يرجى الإنتظار…' : 'إرسال واستلام رابط التحميل'}
          </button>

          {error && (
            <p className="alert alert-danger dl-alert" role="alert">
              {error}
            </p>
          )}
          {message && (
            <div className="alert alert-success dl-alert" role="status">
              <p>{message}</p>
            </div>
          )}

          {!productMissing && (
            <p className="dl-reminder">
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

        .dl-phone-group {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 10px;
          direction: ltr;
          align-items: center;
        }

        .dl-phone-group select,
        .dl-phone-group input {
          direction: ltr;
        }

        .dl-input-code {
          font-weight: 700;
        }

        .dl-input-phone {
          text-align: left;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .dl-select {
          appearance: none;
          background-color: rgba(255, 255, 255, 0.95);
          background-image: linear-gradient(45deg, transparent 50%, #6b7280 50%), linear-gradient(135deg, #6b7280 50%, transparent 50%);
          background-position: calc(100% - 20px) calc(50% - 2px), calc(100% - 15px) calc(50% - 2px);
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          padding-right: 2.5rem;
          cursor: pointer;
        }

        @media (max-width: 420px) {
          .dl-phone-group {
            grid-template-columns: 120px minmax(0, 1fr);
          }
        }
      `}</style>
      </div>
    </section>
  )
}
