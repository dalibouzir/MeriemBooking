'use client'

import { useEffect, useRef } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'

interface ScheduleSectionNewProps {
  startDateLabel: string
  meetingTimeLabel: string
  duration: number
}

export default function ScheduleSectionNew({ startDateLabel, meetingTimeLabel, duration }: ScheduleSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  void startDateLabel
  void meetingTimeLabel
  void duration

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
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="alone-title">
      <div className="chl-wrap">
        <div className="chl-alone-card">
          <span className="chl-alone-leaf" aria-hidden="true" />
          <span className="chl-alone-heart" aria-hidden="true">
            <HeartIcon />
          </span>

          <h2 id="alone-title" className="chl-title">لستِ وحدك</h2>
          <p className="chl-alone-text">
            هذا التحدي مساحة آمنة تشعرين فيها أنك مفهومة
            <br />
            وأن ما تعيشينه ليس ضعفًا… بل نمط يمكن تغييره
          </p>
        </div>
      </div>
    </section>
  )
}
