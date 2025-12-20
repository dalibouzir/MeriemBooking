'use client'

import { useEffect, useRef } from 'react'
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
    <section ref={sectionRef} className="ch-final-cta-section ch-reveal" aria-labelledby="final-cta-title">
      <div className="ch-final-cta-container">
        <div className="ch-final-cta-card">
          <div className="ch-final-cta-glow" aria-hidden="true" />
          
          <div className="ch-final-cta-content">
            <h2 id="final-cta-title" className="ch-final-cta-title">
              🚀 جاهزة لتبدئي رحلتك؟
            </h2>
            
            <p className="ch-final-cta-desc">
              لا تفوّتي هذه الفرصة المجانية للانضمام إلى مجتمع من الأمهات الطموحات.
              سجّلي الآن واحجزي مقعدك قبل نفاد المقاعد!
            </p>

            {!stats.isFull && stats.remainingSeats > 0 && (
              <p className="ch-final-cta-remaining">
                متبقي <strong>{stats.remainingSeats}</strong> مقعد فقط من أصل {stats.maxSeats}
              </p>
            )}

            {stats.isFull && (
              <p className="ch-final-cta-remaining">
                اكتمل العدد! انضمّي لقائمة الانتظار لتكوني أول من يُبلّغ
              </p>
            )}

            <button
              type="button"
              className="ch-btn ch-btn-primary ch-btn-xl"
              onClick={openModal}
            >
              <span className="ch-btn-text">
                {stats.isFull ? '🔔 انضمّي لقائمة الانتظار' : '✨ سجّلي الآن مجاناً'}
              </span>
              <span className="ch-btn-shine" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
