'use client'

import { useEffect, useRef } from 'react'
import { SparklesIcon, LightBulbIcon, HeartIcon } from '@heroicons/react/24/outline'

interface ScheduleSectionNewProps {
  startDateLabel: string
  meetingTimeLabel: string
  duration: number
}

type DayPlan = {
  id: number
  label: string
  title: string
  intro?: string
  points: string[]
}

const DAY_PLANS: DayPlan[] = [
  {
    id: 1,
    label: 'اليوم الأول:',
    title: 'افهمي ما يحدث داخلك',
    points: ['لماذا تفقدين السيطرة رغم أنك تعلمين؟', '(تبسيط عميق لما يحدث في داخلك)'],
  },
  {
    id: 2,
    label: 'اليوم الثاني:',
    title: 'ابدئي التغيير فعليًا',
    intro: 'تمارين واستراتيجيات تساعدك على:',
    points: ['إيقاف ردّة الفعل', 'التعامل مع trigger', 'الخروج من نمط التوتر المتكرر'],
  },
  {
    id: 3,
    label: 'اليوم الثالث:',
    title: 'جلسة تطبيق وأسئلة مباشرة',
    points: ['سنأخذ حالات حقيقية من المشاركات', 'ونطبّق ما تعلّمناه على مواقف واقعية'],
  },
]

const dayIcons = [SparklesIcon, LightBulbIcon, HeartIcon]

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
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="days-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="days-title" className="chl-title">تفاصيل الأيام</h2>
        </header>

        <div className="chl-days-grid">
          {DAY_PLANS.map((day, index) => {
            const Icon = dayIcons[index % dayIcons.length]
            return (
              <article key={day.id} className="chl-day-card ch-reveal-item">
                <span className="chl-day-badge">{day.id}</span>
                <p className="chl-day-label">{day.label}</p>
                <h3 className="chl-day-title">{day.title}</h3>

                {day.intro && <p className="chl-day-intro">{day.intro}</p>}

                <ul className="chl-day-list">
                  {day.points.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <span className="chl-day-bottom-icon" aria-hidden="true">
                  <Icon />
                </span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
