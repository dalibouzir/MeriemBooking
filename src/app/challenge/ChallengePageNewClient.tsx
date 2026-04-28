'use client'

import { useEffect, useRef } from 'react'
import { ChallengeProvider, ChallengeStats } from './ChallengeContext'
import {
  HeroSection,
  BenefitsSectionNew,
  ScheduleSectionNew,
  WhoForSectionNew,
  FinalCTASection,
  StickyCTANew,
  ChallengeModalNew,
} from './components'

export interface ChallengeConfig {
  isEnabled: boolean
  startDateLabel: string
  meetingTimeLabel: string
  duration: number
  maxSeats: number
  title: string
  subtitle: string
  description: string
  benefits: string[]
  targetAudience: string[]
  notFor: string[]
  requirements: string[]
  faqs: { question: string; answer: string }[]
}

interface ChallengePageNewClientProps {
  config: ChallengeConfig
  initialStats: ChallengeStats
}

export default function ChallengePageNewClient({ config, initialStats }: ChallengePageNewClientProps) {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rootEl = pageRef.current
    if (!rootEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = Array.from(rootEl.querySelectorAll<HTMLElement>('.ch-reveal, .ch-reveal-item'))

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            target.classList.add('is-revealed')
            obs.unobserve(target)
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  if (!config.isEnabled) {
    return (
      <main className="ch-page ch-page-unavailable" dir="rtl" lang="ar">
        <div className="ch-unavailable-card">
          <span className="ch-unavailable-icon" aria-hidden="true">🔒</span>
          <h1>التحدّي غير متاح حاليًا</h1>
          <p>هذا التحدي غير مفتوح للتسجيل في الوقت الحالي. تابعينا للإعلان عن الجولة القادمة!</p>
        </div>
      </main>
    )
  }

  return (
    <ChallengeProvider initialStats={initialStats}>
      <main ref={pageRef} className="ch-page chl-page" dir="rtl" lang="ar">
        <div className="chl-page-decor" aria-hidden="true">
          <span className="chl-page-orb chl-page-orb-a" />
          <span className="chl-page-orb chl-page-orb-b" />
          <span className="chl-page-orb chl-page-orb-c" />
        </div>

        <div className="chl-content">
          <HeroSection title={config.title} subtitle={config.subtitle} description={config.description} />
          <BenefitsSectionNew benefits={config.benefits} />
          <ScheduleSectionNew
            startDateLabel={config.startDateLabel}
            meetingTimeLabel={config.meetingTimeLabel}
            duration={config.duration}
          />
          <WhoForSectionNew targetAudience={config.targetAudience} notFor={config.notFor} />
          <FinalCTASection />
        </div>

        <StickyCTANew />
        <ChallengeModalNew />
      </main>
    </ChallengeProvider>
  )
}
