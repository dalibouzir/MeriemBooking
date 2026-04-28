'use client'

import { useEffect, useRef } from 'react'

interface BenefitsSectionNewProps {
  benefits: string[]
}

export default function BenefitsSectionNew({ benefits }: BenefitsSectionNewProps) {
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
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="challenge-benefits" className="chl-section chl-features ch-reveal" aria-labelledby="benefits-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="benefits-title" className="chl-title">ماذا يعني هذا التحدي؟</h2>
        </header>

        <div className="chl-script-block">
          <p className="chl-script-lead">هذا التحدي ليس مجرد نصائح عابرة</p>
          <p className="chl-script-paragraph">
            بل هو مساحة صادقة…
            <br />
            ترين فيها نفسك بوضوح،
            <br />
            وتفهمين لأول مرة أشياء ربما لم تنتبهي لها من قبل
          </p>

          <p className="chl-script-intro-title">ستكتشفين:</p>

          <ul className="chl-script-list">
            {benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
