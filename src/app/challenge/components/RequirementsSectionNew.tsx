'use client'

import { useEffect, useRef } from 'react'

interface RequirementsSectionNewProps {
  requirements: string[]
}

export default function RequirementsSectionNew({ requirements }: RequirementsSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  void requirements

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
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="final-paragraph-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="final-paragraph-title" className="chl-title">الفقرة الأخيرة</h2>
        </header>

        <div className="chl-script-block chl-script-block-centered">
          <p>
            إذا كنتِ تعيشين نفس التوتر كل يوم…
            <br />
            وتتمنين أن يتغير شيء…
            <br />
            حتى لو كان بسيطًا
          </p>
          <p>👉 فهذا التحدي لك</p>
        </div>
      </div>
    </section>
  )
}
