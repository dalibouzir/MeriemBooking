'use client'

import { useEffect, useRef } from 'react'

interface WhoForSectionNewProps {
  targetAudience: string[]
  notFor: string[]
}

export default function WhoForSectionNew({ targetAudience, notFor }: WhoForSectionNewProps) {
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
            }, index * 60)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1 }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [targetAudience, notFor])

  // Default values if not provided
  const displayTargetAudience = targetAudience.length > 0 ? targetAudience : [
    'أم تريد استعادة لياقتها بعد الولادة',
    'سيدة تبحث عن بداية جديدة لنمط حياة صحي',
    'من تريد دعماً ومجتمعاً يحفّزها',
    'مشغولة وتحتاج خطة عملية وبسيطة',
  ]

  const displayNotFor = notFor.length > 0 ? notFor : [
    'من تبحث عن حلول سحرية وسريعة',
    'من لا تستطيع الالتزام لمدة أسبوع',
    'من لديها حالات صحية تمنع التمارين',
  ]

  let itemIndex = 0

  return (
    <section ref={sectionRef} className="ch-whofor-section" aria-labelledby="whofor-title">
      <div className="ch-whofor-container">
        <div className="ch-whofor-header ch-reveal">
          <h2 id="whofor-title" className="ch-section-title">
            🎯 هل هذا التحدي مناسب لك؟
          </h2>
          <p className="ch-section-subtitle">
            تعرّفي إذا كان هذا التحدي هو ما تبحثين عنه
          </p>
        </div>

        <div className="ch-whofor-grid">
          {/* YES Column */}
          <div className="ch-whofor-col ch-whofor-col-yes">
            <h3 className="ch-whofor-col-title">
              <span className="ch-whofor-col-icon">✓</span>
              هذا التحدي لك إذا كنت...
            </h3>
            <div className="ch-whofor-list">
              {displayTargetAudience.map((item, index) => {
                const currentIndex = itemIndex++
                return (
                  <div
                    key={index}
                    ref={(el) => { if (el) itemsRef.current[currentIndex] = el }}
                    data-index={currentIndex}
                    className="ch-whofor-item ch-whofor-item-yes ch-reveal-item"
                  >
                    <span className="ch-whofor-item-icon" aria-hidden="true">✓</span>
                    <span className="ch-whofor-item-text">{item}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* NO Column */}
          <div className="ch-whofor-col ch-whofor-col-no">
            <h3 className="ch-whofor-col-title">
              <span className="ch-whofor-col-icon ch-whofor-col-icon-no">✗</span>
              قد لا يناسبك إذا كنت...
            </h3>
            <div className="ch-whofor-list">
              {displayNotFor.map((item, index) => {
                const currentIndex = itemIndex++
                return (
                  <div
                    key={index}
                    ref={(el) => { if (el) itemsRef.current[currentIndex] = el }}
                    data-index={currentIndex}
                    className="ch-whofor-item ch-whofor-item-no ch-reveal-item"
                  >
                    <span className="ch-whofor-item-icon" aria-hidden="true">✗</span>
                    <span className="ch-whofor-item-text">{item}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
