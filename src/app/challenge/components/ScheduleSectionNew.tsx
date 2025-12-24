'use client'

import { useEffect, useRef } from 'react'

interface ScheduleSectionNewProps {
  startDateLabel: string
  meetingTimeLabel: string
  duration: number
}

export default function ScheduleSectionNew({ startDateLabel, meetingTimeLabel, duration }: ScheduleSectionNewProps) {
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

  const scheduleItems = [
    {
      icon: '📅',
      label: 'تاريخ البداية',
      value: startDateLabel || 'قريباً',
    },
    {
      icon: '⏰',
      label: 'وقت اللقاء',
      value: meetingTimeLabel || 'سيتم تحديده',
    },
    {
      icon: '⏱️',
      label: 'مدة اللقاء',
      value: duration ? `${duration} دقيقة` : '60 دقيقة',
    },
    {
      icon: '🌍',
      label: 'المنصة',
      value: 'Google Meet (أونلاين)',
    },
  ]

  return (
    <section ref={sectionRef} className="ch-schedule-section ch-reveal" aria-labelledby="schedule-title">
      <div className="ch-schedule-container">
        <div className="ch-schedule-header">
          <h2 id="schedule-title" className="ch-section-title">
            📅 موعد التحدي
          </h2>
          <p className="ch-section-subtitle">
            احفظي الموعد في تقويمك واستعدي للانطلاق
          </p>
        </div>

        <div className="ch-schedule-card-wide">
          <div className="ch-schedule-card-glow" aria-hidden="true" />
          
          <div className="ch-schedule-grid">
            {scheduleItems.map((item, index) => (
              <div key={index} className="ch-schedule-item">
                <span className="ch-schedule-item-icon" aria-hidden="true">{item.icon}</span>
                <div className="ch-schedule-item-content">
                  <span className="ch-schedule-item-label">{item.label}</span>
                  <span className="ch-schedule-item-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
