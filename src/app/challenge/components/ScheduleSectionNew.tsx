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
      icon: '📆',
      label: 'بداية اليوم الأول',
      value: startDateLabel || 'قريباً',
    },
    {
      icon: '⏰',
      label: 'موعد اللقاء',
      value: meetingTimeLabel || 'سيتم تحديده',
    },
    {
      icon: '⏱️',
      label: 'إجمالي الوقت',
      value: '90 دقيقة خلال 3 أيام',
    },
    {
      icon: '🧭',
      label: 'صيغة التحدّي',
      value: duration ? `جلسات قصيرة عملية (${duration} دقيقة للجلسة تقريبًا)` : 'جلسات قصيرة عملية',
    },
  ]

  return (
    <section ref={sectionRef} className="ch-schedule-section ch-reveal" aria-labelledby="schedule-title">
      <div className="ch-schedule-container">
        <div className="ch-schedule-header">
          <h2 id="schedule-title" className="ch-section-title">
            قبل أن نبدأ
          </h2>
          <p className="ch-section-subtitle">
            أعطينا فقط 90 دقيقة خلال 3 أيام… وهذه قد تكون نقطة التحوّل الأولى في هدوئك الداخلي.
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
