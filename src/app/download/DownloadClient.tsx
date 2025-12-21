"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { COUNTRY_DIAL_CODES } from '@/data/countryDialCodes'
import { trackLead } from '@/lib/meta/lead'

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
// Removed CLICK_ID_KEY and CLICK_SOURCE_KEY

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2)

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return ''
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

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
  // Removed clickId state
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const product = initialProduct
  const searchParams = useSearchParams()
  const hpRef = useRef<HTMLInputElement | null>(null)
  const snippet = searchParams?.get('snippet') || ''
  const snippetLines = snippet ? snippet.split(/\r?\n/) : []

  const isValidEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  const productMissing = useMemo(() => !product, [product])
  const countryCodeOptions = useMemo(
    () =>
      COUNTRY_DIAL_CODES.filter((entry) => entry.country !== 'Israel').map((entry) => {
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

  // Removed clickId effect

  // Phone validation helpers
  const PHONE_ALERT = 'يرجى إدخال رقم صحيح بدون رموز أو مسافات زائدة.'
  const validateLocalPhone = (val: string, code: string) => {
    const trimmed = val.replace(/\D/g, '')
    // Example: block numbers starting with country code again
    const codeDigits = code.replace(/\D/g, '')
    if (codeDigits && trimmed.startsWith(codeDigits)) return PHONE_ALERT
    return null
  }

  const handlePhoneChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value
    setPhone(val)
    setPhoneError(validateLocalPhone(val, countryCode))
  }

  const handleCountryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newCode = e.target.value
    setCountryCode(newCode)
    // Revalidate against new code
    setPhoneError(validateLocalPhone(phone, newCode))
  }

  const handlePhoneBeforeInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    const ev = e as unknown as InputEvent
    // Block non-digit characters from being entered
    const data = (ev as InputEvent).data
    if (ev.inputType === 'insertText' && data && /\D/.test(data)) {
      e.preventDefault()
      setPhoneError(PHONE_ALERT)
    }
  }

  const handlePhoneKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Allow control/navigation keys
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
    if (allowed.includes(e.key)) return
    // Allow digits only
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      setPhoneError(PHONE_ALERT)
    }
  }

  const handlePhonePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text')
    if (/\D/.test(text)) {
      // Block pasting non-digits
      e.preventDefault()
      setPhoneError(PHONE_ALERT)
      return
    }
    // Let it paste, but validation onChange will handle 00 or country code duplication
  }

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

      const fullName = String(fd.get('full_name') || '').trim()
      const nameParts = fullName.split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      const email = String(fd.get('email') || '').trim()
      const phoneCode = String(fd.get('country_code') || '').trim() || countryCode || DEFAULT_COUNTRY_CODE
      const localPhone = (phone || String(fd.get('phone') || '')).trim()
      // Validate local phone before submit
      const localError = validateLocalPhone(localPhone, phoneCode)
      if (localError) {
        setPhoneError(localError)
        setLoading(false)
        return
      }
      const fullPhone = `${phoneCode} ${localPhone}`.trim()
      const countryName = countryCodeOptions.find((option) => option.code === phoneCode)?.country || ''
      if (!fullName) throw new Error('الاسم مطلوب')
      if (!isValidEmail(email)) throw new Error('البريد الإلكتروني غير صالح')
      if (!product) throw new Error('المنتج غير محدد')

      const res = await fetch('/api/request-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          country: countryName,
          product,
          phone: fullPhone,
          first_name: firstName,
          last_name: lastName,
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

      // Track Lead event (Browser Pixel + Server CAPI with deduplication)
      // Only fires AFTER successful API response - never on validation errors
      trackLead({
        email,
        phone: fullPhone,
        contentName: 'free_booklet',
        formName: 'download_form',
        leadType: 'download',
      }).catch(() => {
        // best-effort; ignore failures
      })

      // Removed click tracking logic

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
          <>
            <div className="dl-trust-badge">
              <span className="dl-trust-icon">🔐</span>
              <span className="dl-trust-text">بياناتك محمية ولن نشاركها أبداً • لا إعلانات • لا رسائل مزعجة</span>
            </div>
            <p className="dl-sub">
              الرجاء إدخال معلوماتك أدناه. فور الإرسال ستصلك رسالة تأكيد تحتوي على:
              <br />- 🔗 رابط مباشر لتحميل المنتج
            </p>
          </>
        )}

          <form id="dl-form" onSubmit={onSubmit} className="dl-form" noValidate>
            <input type="hidden" name="product" value={product} />
            {!productMissing && snippetLines.length > 0 && (
              <div className="dl-snippet">
                <p className="dl-snippet-label">مقتطف عن الملف</p>
                {snippetLines.map((line, index) => (
                  <p key={`snippet-line-${index}`} className="dl-snippet-text">
                    {line}
                  </p>
                ))}
              </div>
            )}
          {/* Honeypot */}
          <input ref={hpRef} name="website" tabIndex={-1} autoComplete="off" className="dl-hp" />

          <div className="dl-field">
            <label htmlFor="dl-full-name" className="dl-label">الاسم الكامل</label>
            <input id="dl-full-name" name="full_name" required className="dl-input" autoComplete="name" placeholder="مثال: سارة أحمد" />
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
            <label htmlFor="dl-phone" className="dl-label">رقم الواتساب <span className="dl-optional">(اختياري)</span></label>
            <div className="dl-phone-group">
              <label className="sr-only" htmlFor="country_code">
                رمز الدولة
              </label>
              <select
                id="country_code"
                name="country_code"
                required
                className="dl-input dl-input-code dl-select"
                value={countryCode}
                onChange={handleCountryChange}
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
                className="dl-input dl-input-phone"
                placeholder="5x xxx xxxx (اختياري)"
                dir="ltr"
                value={phone}
                onChange={handlePhoneChange}
                onBeforeInput={handlePhoneBeforeInput}
                onKeyDown={handlePhoneKeyDown}
                onPaste={handlePhonePaste}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? 'dl-phone-error' : undefined}
              />
            </div>
            {phoneError && (
              <p id="dl-phone-error" className="dl-field-error" role="alert">
                {PHONE_ALERT}
              </p>
            )}
          </div>

          <button type="submit" className="dl-btn" disabled={loading || productMissing}>
            {loading ? '⏳ جارٍ الإرسال…' : '📥 تحميل مجاني الآن'}
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
        .dl-input[aria-invalid="true"],
        .dl-input-phone[aria-invalid="true"] {
          outline: none;
          border: 1px solid #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
        }

        .dl-field-error {
          color: #dc2626;
          margin-top: 6px;
          font-size: 0.9rem;
          line-height: 1.4;
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

        .dl-snippet {
          background: hsla(var(--accent) / 0.12);
          border: 1px solid hsla(var(--accent) / 0.4);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.95rem;
        }

        .dl-snippet-label {
          font-weight: 700;
          color: hsl(var(--accent));
        }

        .dl-snippet-text {
          margin: 0;
          color: hsl(var(--text));
          line-height: 1.4;
        }

        .dl-trust-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.08));
          border: 1px dashed rgba(59, 130, 246, 0.4);
          border-radius: 10px;
          padding: 12px 18px;
          margin-bottom: 16px;
          font-size: 0.85rem;
          text-align: center;
        }

        .dl-trust-icon {
          font-size: 1.1rem;
        }

        .dl-trust-text {
          color: #1e40af;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        :global(.dark) .dl-trust-badge {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1));
          border-color: rgba(99, 102, 241, 0.5);
        }

        :global(.dark) .dl-trust-text {
          color: #93c5fd;
        }

        .dl-optional {
          font-size: 0.8rem;
          font-weight: 400;
          color: #6b7280;
        }

        :global(.dark) .dl-optional {
          color: #9ca3af;
        }
      `}</style>
      </div>
    </section>
  )
}
