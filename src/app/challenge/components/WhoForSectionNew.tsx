'use client'

import { useEffect, useRef } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface WhoForSectionNewProps {
  targetAudience: string[]
  notFor: string[]
}

const fallbackItems = [
  'فهم حقيقي لما يحدث داخلك في لحظة الضغط',
  'وعي trigger أساسي يسبب أغلب توترك',
  'تعلّم استراتيجيات وتمارين بسيطة لتغيير ردّة فعلك',
  'خطوات عملية تساعدك على الاستمرار بعد التحدي',
]

export default function WhoForSectionNew({ targetAudience, notFor }: WhoForSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  void notFor

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

  const items = targetAudience.length > 0 ? targetAudience : fallbackItems

  return (
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="checklist-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="checklist-title" className="chl-title">ماذا ستحصلين عليه؟</h2>
          <p className="chl-subtitle">كل ما تحتاجينه لتبدئي التغيير بشكل عملي</p>
        </header>

        <div className="chl-checklist-box">
          {items.map((text, index) => (
            <div key={index} className="chl-checklist-row">
              <p>{text}</p>
              <span className="chl-check-icon-wrap" aria-hidden="true">
                <CheckCircleIcon className="chl-check-icon" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
