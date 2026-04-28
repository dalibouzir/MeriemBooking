'use client'

import { useEffect, useRef } from 'react'

interface RequirementsSectionNewProps {
  requirements: string[]
}

const defaultRequirements = [
  { icon: '١', text: 'اليوم الأول: افهمي ما يحدث داخلك. لماذا تفقدين السيطرة رغم أنك تعلمين؟ (تبسيط عميق لما يحدث في داخلك).' },
  { icon: '٢', text: 'اليوم الثاني: ابدئي التغيير فعليًا عبر تمارين واستراتيجيات تساعدك على إيقاف ردّة الفعل، التعامل مع trigger، والخروج من نمط التوتر المتكرر.' },
  { icon: '٣', text: 'اليوم الثالث: جلسة تطبيق وأسئلة مباشرة على حالات حقيقية من المشاركات لتطبيق ما تعلّمناه على مواقف واقعية.' },
]

export default function RequirementsSectionNew({ requirements }: RequirementsSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      itemsRef.current.forEach((el) => el?.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const index = parseInt(el.dataset.index || '0', 10)
            setTimeout(() => {
              el.classList.add('is-revealed')
            }, index * 100)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [requirements])

  const displayItems = requirements.length > 0
    ? requirements.map((text, i) => ({
        icon: defaultRequirements[i % defaultRequirements.length].icon,
        text,
      }))
    : defaultRequirements

  return (
    <section ref={sectionRef} className="ch-requirements-section" aria-labelledby="requirements-title">
      <div className="ch-requirements-container">
        <div className="ch-requirements-header ch-reveal">
          <h2 id="requirements-title" className="ch-section-title">
            تفاصيل الأيام
          </h2>
          <p className="ch-section-subtitle">
            ثلاثة أيام قصيرة، لكن مركّزة، تبدأين فيها فهم ما يحدث وتطبيق تغيير عملي.
          </p>
        </div>

        <div className="ch-requirements-grid">
          {displayItems.map((item, index) => {
            return (
              <div
                key={index}
                ref={(el) => { if (el) itemsRef.current[index] = el }}
                data-index={index}
                className="ch-requirement-card ch-reveal-item"
              >
                <div className="ch-requirement-icon-wrap">
                  <span className="ch-requirement-icon" aria-hidden="true">{item.icon}</span>
                </div>
                <p className="ch-requirement-text">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
