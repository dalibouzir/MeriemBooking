'use client'

import { useEffect, useRef } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useChallengeContext } from '../ChallengeContext'

export default function FinalCTASection() {
  const { stats, openModal } = useChallengeContext()
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
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="chl-final ch-reveal" aria-labelledby="final-cta-title">
      <div className="chl-wrap">
        <div className="chl-final-card">
          <span className="chl-final-leaf chl-final-leaf-right" aria-hidden="true" />
          <span className="chl-final-leaf chl-final-leaf-left" aria-hidden="true" />
          <span className="chl-final-spark chl-final-spark-a" aria-hidden="true" />
          <span className="chl-final-spark chl-final-spark-b" aria-hidden="true" />

          <h2 id="final-cta-title" className="chl-final-title">
            إذا كنتِ تعيشين نفس التوتر كل يوم…
            <br />
            وتتمنين أن يتغير شيء…
            <br />
            حتى لو كان بسيطًا
          </h2>

          <p className="chl-final-sub">👉 فهذا التحدي لك</p>

          <button type="button" className="chl-btn chl-btn-primary" onClick={openModal}>
            {stats.isFull ? 'انضمّي لقائمة الانتظار' : 'احجزي مكانك الآن مجانًا'}
            <SparklesIcon className="chl-btn-icon" aria-hidden="true" />
          </button>

          <p className="chl-final-trust">وابدئي أول خطوة نحو هدوء حقيقي من الداخل</p>
          <p className="chl-final-proof">إذا كنتِ تعيشين نفس التوتر كل يوم… فهذا التحدي لك</p>
        </div>
      </div>
    </section>
  )
}
