'use client'

import { useEffect, useRef } from 'react'

interface RequirementsSectionNewProps {
  requirements: string[]
}

const defaultRequirements = [
  { icon: '📱', text: 'هاتف أو حاسوب مع اتصال بالإنترنت' },
  { icon: '🕒', text: 'مكان هادئ لمدة ساعة' },
  { icon: '❤️', text: 'الرغبة في الاهتمام بنفسك' },
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

  // Use provided requirements or defaults
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
            📋 ما تحتاجينه للمشاركة
          </h2>
          <p className="ch-section-subtitle">
            متطلبات بسيطة لتبدئي رحلتك معنا
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
