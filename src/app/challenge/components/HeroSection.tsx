'use client'

import { useEffect, useRef, useState } from 'react'
import { SparklesIcon, HeartIcon, UserGroupIcon } from '@heroicons/react/24/outline'
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
            if (progress < 1) requestAnimationFrame(animate)
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

    const timer = setTimeout(() => el.classList.add('is-revealed'), 80)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={heroRef} className="chl-hero ch-reveal" aria-labelledby="hero-title">
      <div className="chl-wrap chl-hero-wrap">
        <aside className="chl-stats-card" aria-label="إحصائيات التسجيل">
          <h2 className="chl-stats-title">إحصائيات التسجيل</h2>

          <div className="chl-stat-box">
            <div>
              <p className="chl-stat-label">مسجّلة مؤكدة</p>
              <p className="chl-stat-value"><AnimatedNumber value={stats.confirmedCount} /></p>
            </div>
            <UserGroupIcon className="chl-stat-icon" aria-hidden="true" />
          </div>

          <div className="chl-stat-box">
            <div>
              <p className="chl-stat-label">مقعد متبقٍ</p>
              <p className="chl-stat-value"><AnimatedNumber value={stats.remainingSeats} /></p>
            </div>
            <HeartIcon className="chl-stat-icon" aria-hidden="true" />
          </div>

          {stats.isFull && (
            <p className="chl-stat-foot">اكتمل العدد الحالي، التسجيل متاح في قائمة الانتظار.</p>
          )}

          {!stats.isFull && (
            <>
              <div className="chl-stat-rate">
                <span>معدل التسجيل</span>
                <span className="chl-stars">{Math.min(99, Math.round((stats.confirmedCount / Math.max(stats.maxSeats, 1)) * 100))}%</span>
              </div>
              <p className="chl-stat-foot">المقاعد المتبقية تنخفض بسرعة. احجزي مكانك الآن.</p>
            </>
          )}
        </aside>

        <div className="chl-hero-content">
          <div className="chl-hero-decor" aria-hidden="true">
            <span className="chl-hero-glow" />
            <span className="chl-hero-leaf" />
          </div>

          <span className="chl-pill">تحدي العناية بنفسك</span>

          <h1 id="hero-title" className="chl-hero-title">{title || 'تحدّي الأم الهادئة في 3 أيام'}</h1>
          {subtitle && <p className="chl-hero-lead">{subtitle}</p>}

          <div className="chl-hero-copy-card">
            {description && <p className="chl-hero-text">{description}</p>}
          </div>

          <div className="chl-hero-sub-card">
            <div className="chl-qa-block">
              <p className="chl-qa-question">
                هل سئمتِ من فقدان السيطرة ثم الندم؟
                <br />
                من أن تقولي لنفسك “لن أكرر هذا”…
                <br />
                <br />
                ثم تجدين نفسك في نفس الموقف مرة أخرى؟
              </p>
              <p className="chl-qa-answer">
                انضمّي إلى هذا التحدّي
                <br />
                حيث سنكشف معًا ما يحدث داخلك في لحظة الانفعال…
                <br />
                ولماذا يتكرّر، وكيف تبدئين تغييره
              </p>
            </div>
          </div>

          <div className="chl-hero-actions">
            <button type="button" className="chl-btn chl-btn-primary" onClick={openModal}>
              {stats.isFull ? 'انضمّي لقائمة الانتظار' : 'احجزي مكانك الآن مجانًا'}
              <SparklesIcon className="chl-btn-icon" aria-hidden="true" />
            </button>
            <button type="button" className="chl-btn chl-btn-outline" onClick={scrollToDetails}>
              اقرئي تفاصيل التحدي
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
