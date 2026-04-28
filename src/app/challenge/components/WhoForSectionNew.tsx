'use client'

import { useEffect, useRef } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface WhoForSectionNewProps {
  targetAudience: string[]
  notFor: string[]
}

export default function WhoForSectionNew({ targetAudience, notFor }: WhoForSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('is-revealed')
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="checklist-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="checklist-title" className="chl-title">ماذا ستحصلين عليه؟</h2>
          <p className="chl-subtitle">خلال هذه الأيام الثلاثة، لن نطلب منك أن تكوني مثالية</p>
        </header>

        <div className="chl-checklist-box">
          <p className="chl-script-intro">بل ستبدئين بـ:</p>
          <ul className="chl-checklist-list">
            {targetAudience.map((text) => (
              <li key={text} className="chl-checklist-row">
                <p>{text}</p>
                <span className="chl-check-icon-wrap" aria-hidden="true">
                  <CheckCircleIcon className="chl-check-icon" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="chl-script-note">👉 هذه ليست نهاية التغيير…<br />لكنها بداية صادقة وواقعية له</p>

        <div className="chl-alone-card chl-alone-inline">
          <h2 className="chl-title">لستِ وحدك</h2>
          <p className="chl-alone-text">
            {notFor[0]}
            <br />
            {notFor[1]}
            <br />
            {notFor[2]}
          </p>
        </div>
      </div>
    </section>
  )
}
