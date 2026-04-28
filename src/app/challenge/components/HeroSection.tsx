'use client'

import { useEffect, useRef, useState } from 'react'
import { useChallengeContext } from '../ChallengeContext'

interface HeroSectionProps {
  title: string
  subtitle: string
  description: string
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setDisplayValue(value)
      hasAnimated.current = true
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.round(eased * value))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration])

  return <span ref={ref}>{displayValue}</span>
}

export default function HeroSection({ title, subtitle, description }: HeroSectionProps) {
  const { stats, openModal, scrollToDetails } = useChallengeContext()
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.classList.add('is-revealed')
      return
    }

    const timer = setTimeout(() => el.classList.add('is-revealed'), 100)
    return () => clearTimeout(timer)
  }, [])

  const progressPercent = stats.maxSeats > 0
    ? Math.min(((stats.maxSeats - stats.remainingSeats) / stats.maxSeats) * 100, 100)
    : 0

  return (
    <section ref={heroRef} className="ch-hero" aria-labelledby="hero-title">
      <div className="ch-hero-bg" aria-hidden="true">
        <div className="ch-hero-blob ch-hero-blob-1" />
        <div className="ch-hero-blob ch-hero-blob-2" />
        <div className="ch-hero-blob ch-hero-blob-3" />
        <div className="ch-hero-gradient" />
      </div>

      <div className="ch-hero-container">
        <div className="ch-hero-grid">
          <div className="ch-hero-content">
            <div className="ch-hero-badges">
              <span className="ch-badge ch-badge-online">3 أيام</span>
              <span className="ch-badge ch-badge-limited">90 دقيقة فقط</span>
              <span className="ch-badge ch-badge-free">مجانًا</span>
            </div>

            <h1 id="hero-title" className="ch-hero-title">
              {title || 'تحدّي الأم الهادئة في 3 أيام'}
            </h1>

            {subtitle && (
              <p className="ch-hero-subtitle">{subtitle}</p>
            )}

            {description && (
              <p className="ch-hero-desc">{description}</p>
            )}

            <p className="ch-hero-desc">
              هل سئمتِ من فقدان السيطرة ثم الندم؟ من أن تقولي لنفسك "لن أكرر هذا"…
              ثم تجدين نفسك في نفس الموقف مرة أخرى؟
            </p>

            <p className="ch-hero-desc">
              انضمّي إلى هذا التحدّي حيث سنكشف معًا ما يحدث داخلك في لحظة الانفعال…
              ولماذا يتكرّر، وكيف تبدئين تغييره.
            </p>

            <div className="ch-hero-cta">
              <button
                type="button"
                className="ch-btn ch-btn-primary ch-btn-xl"
                onClick={openModal}
              >
                <span className="ch-btn-text">
                  {stats.isFull ? 'انضمّي لقائمة الانتظار' : 'احجزي مكانك الآن مجانًا'}
                </span>
                <span className="ch-btn-shine" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="ch-btn ch-btn-secondary ch-btn-lg"
                onClick={scrollToDetails}
              >
                اقرأي تفاصيل التحدّي
              </button>
            </div>

            <p className="ch-hero-micro">
              البداية لا تحتاج مثالية… فقط خطوة صادقة.
            </p>
          </div>

          <div className="ch-hero-stats-panel">
            <div className="ch-stats-card">
              <div className="ch-stats-card-glow" aria-hidden="true" />

              <h2 className="ch-stats-title">إحصائيات التسجيل</h2>

              <div className="ch-stats-grid">
                <div className="ch-stat-item ch-stat-main">
                  <span className="ch-stat-icon" aria-hidden="true">👩‍👧</span>
                  <div>
                    <div className="ch-stat-value">
                      <AnimatedNumber value={stats.confirmedCount} />
                    </div>
                    <div className="ch-stat-label">مسجّلة مؤكدة</div>
                  </div>
                </div>

                <div className={`ch-stat-item ${stats.remainingSeats <= 5 ? 'ch-stat-urgent' : ''}`}>
                  {stats.remainingSeats <= 5 && stats.remainingSeats > 0 && (
                    <span className="ch-stat-badge">الفرص الأخيرة</span>
                  )}
                  <span className="ch-stat-icon" aria-hidden="true">🎯</span>
                  <div>
                    <div className="ch-stat-value">
                      <AnimatedNumber value={stats.remainingSeats} />
                    </div>
                    <div className="ch-stat-label">مقعد متبقٍ</div>
                  </div>
                </div>

                {stats.isFull && stats.waitlistCount > 0 && (
                  <div className="ch-stat-item ch-stat-waitlist">
                    <span className="ch-stat-icon" aria-hidden="true">⏳</span>
                    <div>
                      <div className="ch-stat-value">
                        <AnimatedNumber value={stats.waitlistCount} />
                      </div>
                      <div className="ch-stat-label">في الانتظار</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ch-stats-progress">
                <div className="ch-progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="ch-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="ch-progress-glow"
                    style={{ left: `${progressPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="ch-progress-labels">
                  <span>{stats.confirmedCount} مسجّلة</span>
                  <span>{stats.maxSeats} السعة الكاملة</span>
                </div>
              </div>

              {stats.remainingSeats <= 10 && stats.remainingSeats > 0 && (
                <p className="ch-stats-warning">
                  إذا يناسبك هذا التحدّي، احجزي مكانك قبل اكتمال العدد.
                </p>
              )}

              {stats.isFull && (
                <p className="ch-stats-full">
                  اكتمل العدد الحالي. يمكنك الانضمام إلى قائمة الانتظار.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ch-hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}
