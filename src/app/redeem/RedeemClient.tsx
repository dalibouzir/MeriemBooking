'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const HERO_LINES = [
  'منصّة تُساعد المرأة على استعادة أنوثتها وفطرتها،',
  'لتعيش علاقات صحّية، وبيتًا أهدأ، ومجتمعًا أكثر اتّزانًا.',
  'فحين تتّزن المرأة… ينعكس نورها على أسرتها،',
  'ويمتد أثرها إلى الجيل القادم كلّه.',
]

const SESSION_AUDIENCE = [
  {
    title: 'يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية',
    detail: '(علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)',
  },
  {
    title: 'يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته',
    detail: 'أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها.',
  },
  {
    title: 'لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق',
    detail: '(الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)',
  },
]

const SESSION_FLOW = [
  {
    title: 'استخراج الكود العاطفي للمشكلة الأساسية',
    detail: 'من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.',
  },
  {
    title: 'تحويل الكود المضطرب إلى كود متزن',
    detail: 'ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.',
  },
]

const SESSION_DOWNLOAD_FILENAME = 'fittrah-session-guide.txt'
const SESSION_DOWNLOAD_TEXT = `جلسة فردية للإرشاد نحو الاتزان

جلسة هادئة وعميقة مدّتها ساعة، مخصّصة لكل من يحتاج مساحة آمنة يفهم فيها مشاعره، ويستعيد توازنه الداخلي بخطوات واضحة ومدروسة.

⸻

لمن تناسب هذه الجلسة؟
• يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية (علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)
• يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته، أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها
• لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق (الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)

⸻

ماذا نفعل داخل الجلسة؟
• استخراج الكود العاطفي للمشكلة الأساسية: من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.
• تحويل الكود المضطرب إلى كود متزن: ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.

⸻

ملاحظة مهمة:
تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من أشكال جلد الذات.

جلسات سرّية، فردية، ومخصّصة لك تمامًا.`

export default function RedeemClient() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement | null>(null)

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

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleDownloadSession() {
    try {
      const blob = new Blob([SESSION_DOWNLOAD_TEXT], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = SESSION_DOWNLOAD_FILENAME
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch {
      // Ignore download errors silently
    }
  }

  return (
    <section id="redeem" dir="rtl" className="rd-shell rd-section">
      <div className="rd-hero">
        <div className="rd-hero-panel">
          <div className="rd-hero-chip">
            <span>Fittrah Moms</span>
            <small>مساحتك للسكينة والأنوثة والاتزان العاطفي</small>
          </div>
          <div className="rd-hero-text">
            <h1>استبدلي رمزك واحجزي جلسة الاتزان</h1>
            <p>
              أدخلي الرمز الذي وصل إلى بريدك بعد تحميل أي مورد، وحدّدي موعد المكالمة الفردية مع مريم بوزير في دقائق معدودة.
            </p>
          </div>
          <div className="rd-hero-intro" aria-label="مقدمة المنصّة">
            {HERO_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="rd-hero-ornament" aria-hidden />
      </div>

      <div className="rd-layout">
        <article className="rd-session-card" aria-labelledby="rd-session-title">
          <div className="rd-session-block rd-session-about">
            <span className="rd-session-chip">جلسة فردية</span>
            <div className="rd-session-heading">
              <h2 id="rd-session-title">جلسة فردية للإرشاد نحو الاتزان</h2>
              <p>
                جلسة هادئة وعميقة مدّتها ساعة، مخصّصة لكل من يحتاج مساحة آمنة يفهم فيها مشاعره، ويستعيد توازنه الداخلي بخطوات واضحة ومدروسة.
              </p>
            </div>
          </div>

          <div className="rd-session-mini-grid">
            <div className="rd-session-block">
              <p className="rd-session-label">لمن تناسب هذه الجلسة؟</p>
              <ul className="rd-session-list">
                {SESSION_AUDIENCE.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rd-session-block">
              <p className="rd-session-label">ماذا نفعل داخل الجلسة؟</p>
              <ul className="rd-session-list">
                {SESSION_FLOW.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rd-session-block rd-session-note" role="note">
            <p className="rd-session-label">ملاحظة مهمة</p>
            <p>تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من أشكال جلد الذات.</p>
          </div>

          <div className="rd-session-actions">
            <button type="button" className="rd-session-btn" onClick={scrollToForm}>
              احجزي جلستك
            </button>
            <button type="button" className="rd-session-download" onClick={handleDownloadSession}>
              تحميل النسخة النصية
            </button>
          </div>
        </article>

        <div className="rd-card glass-water rd-form-card">
          <div className="rd-form-head">
            <h2 className="rd-title">تأكيد رمز المكالمة</h2>
            <p className="rd-sub">أدخل/ي الكود الذي وصلك عبر البريد الإلكتروني للحصول على موعدك.</p>
          </div>

          <form
            ref={formRef}
            id="redeem-form"
            className="rd-form"
            onSubmit={(e) => {
              e.preventDefault()
              redeem()
            }}
            noValidate
          >
            <div className="rd-field">
              <label htmlFor="code" className="rd-label">
                الكود
              </label>
              <span className="rd-input-icon" aria-hidden>
                🎟️
              </span>
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
                <button type="button" className="rd-tool" onClick={handlePaste} title="لصق">
                  لصق
                </button>
                {code && (
                  <button type="button" className="rd-tool" onClick={clearCode} title="مسح">
                    مسح
                  </button>
                )}
              </div>
            </div>

            {error && (
              <p className="rd-alert rd-alert-danger" role="alert">
                {error}
              </p>
            )}

            <div className="rd-actions">
              <button type="submit" className={`rd-btn ${loading ? 'is-loading' : ''}`} disabled={loading || !code.trim()}>
                {loading ? '...يرجى الانتظار' : 'تأكيد الكود'}
              </button>
            </div>
          </form>

          <div className="rd-form-note" role="note">
            <p className="rd-tip">نحوّل أحرف الكود تلقائيًا إلى أحرف كبيرة لتجنّب الالتباس.</p>
          </div>
        </div>
      </div>

      <div className="rd-bottom-cta" aria-live="polite">
        <button type="button" className="rd-bottom-btn" onClick={scrollToForm}>
          تحصل على جلستك الآن
        </button>
        <p className="rd-session-reassure">جلسات سرّية، فردية، ومخصّصة لك تمامًا.</p>
      </div>
    </section>
  )
}
