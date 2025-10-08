"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const CALENDLY_URL = (process.env.NEXT_PUBLIC_SUCCESS_CALL_BOOKING_URL || 'https://calendly.com/meriembouzir/30min').trim()

type Status = 'missing' | 'checking' | 'valid' | 'invalid'

type VerifyResponse = {
  valid?: boolean
  email?: string | null
  error?: string
}

export default function FreeCallClient({ initialToken = '' }: { initialToken?: string }) {
  const token = initialToken.trim()
  const [status, setStatus] = useState<Status>(token ? 'checking' : 'missing')
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function verify() {
      try {
        const res = await fetch(`/api/call/verify?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        const data = (await res.json().catch(() => ({}))) as VerifyResponse
        if (cancelled) return
        if (!res.ok || !data?.valid) {
          setStatus('invalid')
          setError(data?.error || 'انتهت صلاحية هذا الرمز أو تم استخدامه مسبقًا.')
          return
        }
        setEmail((data.email ?? '') || null)
        setStatus('valid')
      } catch {
        if (!cancelled) {
          setStatus('invalid')
          setError('تعذّر التحقق من الرمز. أعيدي المحاولة بعد لحظات أو تواصلي مع الدعم.')
        }
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [token])

  const calendlyHref = useMemo(() => (CALENDLY_URL ? CALENDLY_URL : '#'), [])

  if (status === 'missing') {
    return (
      <section dir="rtl" className="fc-simple-wrapper">
        <div className="fc-card glass-water polished">
          <header className="fc-header">
            <h1>لا يمكنك الدخول</h1>
            <p>هذه الصفحة محمية برمز مخصّص لتأكيد الجلسة المجانية. استعيني بالكود الذي وصلك بعد التنزيل أو تواصلي مع الدعم.</p>
          </header>
          <div className="fc-actions">
            <Link href="/redeem" className="btn btn-primary">عندي كود — أريد تفعيله</Link>
            <Link href="/" className="btn btn-outline">رجوع للمتجر</Link>
          </div>
        </div>
      </section>
    )
  }

  if (status === 'checking') {
    return (
      <section dir="rtl" className="fc-simple-wrapper">
        <div className="fc-card glass-water polished">
          <p className="fc-status">جارٍ التحقق من الرمز…</p>
        </div>
      </section>
    )
  }

  if (status === 'invalid') {
    return (
      <section dir="rtl" className="fc-simple-wrapper">
        <div className="fc-card glass-water polished">
          <header className="fc-header">
            <h1>الرمز غير صالح</h1>
            <p>{error || 'هذا الرمز غير صالح أو انتهت صلاحيته. يرجى استبداله برمز جديد أو التواصل مع الدعم.'}</p>
          </header>
          <div className="fc-actions">
            <Link href="/redeem" className="btn btn-primary">استبدال رمز جديد</Link>
            <a className="btn btn-outline" href="https://wa.me/" target="_blank" rel="noopener noreferrer">مراسلة الدعم</a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section dir="rtl" className="fc-simple-wrapper">
      <div className="fc-card glass-water polished">
        <Image
          src="/Meriem.webp"
          alt="مريم"
          width={120}
          height={120}
          className="fc-avatar"
          priority
        />
        <header className="fc-header">
          <h1>جاهزة لحجز جلستك المجانية</h1>
          <p>
            مبروك! هذا الكود يمنحك جلسة استشارية مجانية بالكامل عبر Calendly.
            {email ? ` سيتم إرسال تأكيد الحجز إلى ${email}.` : ''}
          </p>
        </header>

        <ol className="fc-steps" aria-label="خطوات الحجز">
          <li>اضغطي الزر أدناه لفتح صفحة الحجز على Calendly في نافذة جديدة.</li>
          <li>اختاري الوقت المناسب، وأكملي بياناتك داخل Calendly.</li>
          <li>تأكدي من وصول رسالة التأكيد إلى بريدك (الجلسة مجانية — لن يُطلب منك الدفع).</li>
        </ol>

        <a
          className="fc-calendly-btn"
          href={calendlyHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          فتح صفحة الحجز على Calendly
        </a>

        <p className="fc-support">
          إن واجهت أي مشكلة في الحجز، راسلينا عبر واتساب وسنساعدك فورًا.
        </p>
      </div>

      <style jsx>{`
        .fc-simple-wrapper {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1.5rem, 4vw, 3rem);
          background:
            radial-gradient(58% 50% at 82% 6%, hsl(var(--accent) / 0.28), transparent 74%),
            radial-gradient(54% 46% at 18% 96%, hsl(var(--secondary) / 0.24), transparent 72%),
            linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--bg)) 48%, hsl(var(--surface-muted)) 100%);
        }

        .fc-simple-wrapper::before,
        .fc-simple-wrapper::after {
          content: '';
          position: absolute;
          inset: -32% -22%;
          pointer-events: none;
          background: radial-gradient(48% 48% at 24% 34%, hsl(var(--surface-strong) / 0.45), transparent 76%);
          opacity: 0.4;
        }

        .fc-simple-wrapper::after {
          inset: -28% -24%;
          background: radial-gradient(48% 48% at 70% 70%, hsl(var(--primary) / 0.22), transparent 78%);
          opacity: 0.28;
        }

        .fc-card {
          width: min(560px, 100%);
          padding: clamp(1.5rem, 5vw, 2.75rem);
          text-align: right;
          display: grid;
          gap: 1.25rem;
          background: hsla(var(--glass));
          border-radius: clamp(22px, 4vw, 32px);
          border: 1px solid var(--surface-border);
          box-shadow: var(--shadow-2);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          backdrop-filter: blur(22px) saturate(160%);
        }

        .fc-avatar {
          border-radius: 50%;
          box-shadow: 0 12px 30px hsl(var(--primary-700) / 0.25);
          align-self: center;
        }

        .fc-header h1 {
          font-size: clamp(1.35rem, 3vw, 1.9rem);
          font-weight: 800;
          color: hsl(var(--text));
          margin-bottom: 0.35rem;
        }

        .fc-header p {
          font-size: 1rem;
          color: hsl(var(--text-dim));
          line-height: 1.7;
          margin: 0;
        }

        .fc-steps {
          margin: 0;
          padding: 0 1.3rem 0 0;
          display: grid;
          gap: 0.65rem;
          color: hsl(var(--text));
          font-size: 0.98rem;
        }

        .fc-steps li {
          list-style: decimal;
          line-height: 1.55;
        }

        .fc-calendly-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.9rem 1.4rem;
          border-radius: 999px;
          background: linear-gradient(90deg, hsl(var(--primary-700)), hsl(var(--accent)));
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          box-shadow: 0 20px 35px hsl(var(--primary-700) / 0.22);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .fc-calendly-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 44px hsl(var(--primary-700) / 0.28);
        }

        .fc-support {
          font-size: 0.95rem;
          color: hsl(var(--text-dim));
          margin: 0;
        }

        .fc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .fc-status {
          font-size: 1rem;
          color: hsl(var(--primary-700));
          text-align: center;
        }

        @media (max-width: 640px) {
          .fc-card {
            text-align: right;
          }
        }
      `}</style>
    </section>
  )
}
