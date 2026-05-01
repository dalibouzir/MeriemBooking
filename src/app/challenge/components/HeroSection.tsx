'use client'

import { useEffect, useRef } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useChallengeContext } from '../ChallengeContext'

interface HeroSectionProps {
  title: string
  subtitle: string
  description: string
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
