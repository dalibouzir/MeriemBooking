'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RedeemClient() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const preset = searchParams.get('code')?.trim()
    if (preset) {
      setCode(preset.toUpperCase())
      setError(null)
    }
  }, [searchParams])

  async function redeem() {
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    try {
      // Normalize: trim + UPPERCASE (keeps dashes if user typed them)
      const payload = { code: code.trim().toUpperCase() }

      const res = await fetch('/api/call/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'تعذّر تأكيد الكود. يرجى المحاولة من جديد.')
        return
      }

      if (data?.token) {
        router.push(`/free-call?token=${encodeURIComponent(data.token)}`)
      } else {
        setError('تم التأكيد لكن لم نستلم رمز الموعد.')
      }
    } catch {
      setError('حدث خطأ غير متوقع. حاول/ي مجددًا.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePaste() {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setCode(t.trim().toUpperCase())
    } catch {
      // clipboard might be blocked — ignore quietly
    }
  }

  function clearCode() {
    setCode('')
    setError(null)
  }

  return (
    <section id="redeem" dir="rtl" className="rd-section">
      <div className="rd-card glass-water">
        <h1 className="rd-title">استبدال الكود</h1>
        <p className="rd-sub">أدخل/ي الكود الذي وصلك عبر البريد الإلكتروني للحصول على موعد المكالمة المجانية.</p>

        <form
          className="rd-form"
          onSubmit={(e) => { e.preventDefault(); redeem() }}
          noValidate
        >
          <div className="rd-field">
            <label htmlFor="code" className="rd-label">الكود</label>
            <span className="rd-input-icon" aria-hidden>🎟️</span>
            <input
              id="code"
              name="code"
              autoFocus
              inputMode="text"
              autoComplete="one-time-code"
              className="rd-input"
              placeholder="مثال: XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              aria-invalid={!!error}
            />

            <div className="rd-field-tools">
              <button type="button" className="rd-tool" onClick={handlePaste} title="لصق">لصق</button>
              {code && (
                <button type="button" className="rd-tool" onClick={clearCode} title="مسح">مسح</button>
              )}
            </div>
          </div>

          {error && (
            <p className="rd-alert rd-alert-danger" role="alert">
              {error}
            </p>
          )}

          <div className="rd-actions">
            <button
              type="submit"
              className={`rd-btn ${loading ? 'is-loading' : ''}`}
              disabled={loading || !code.trim()}
            >
              {loading ? '...يرجى الانتظار' : 'تأكيد الكود'}
            </button>
          </div>

          <p className="rd-tip">نحوّل أحرف الكود تلقائيًا إلى أحرف كبيرة لتجنّب الالتباس.</p>
        </form>
      </div>
    </section>
  )
}
