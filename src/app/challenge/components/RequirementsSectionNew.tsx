'use client'

import { useEffect, useRef } from 'react'
import { SparklesIcon, HeartIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface RequirementsSectionNewProps {
  requirements: string[]
}

type DayPlan = {
  id: number
  label: string
  title: string
  points: string[]
}

const DAY_PLANS: DayPlan[] = [
  {
    id: 1,
    label: 'اليوم الأول',
    title: 'فهمي نفسك بعمق',
    points: [
      'لماذا تفقدين السيطرة رغم معرفتك للصواب',
      'كيف يعمل نمط التوتر المتكرر داخلك',
      'تبسيط عميق لما يحدث في لحظة الانفعال',
    ],
  },
  {
    id: 2,
    label: 'اليوم الثاني',
    title: 'ابدئي التغيير عمليًا',
    points: [
      'تمارين توقف ردّة الفعل قبل الانفجار',
      'التعامل مع trigger بطريقة واقعية',
      'خطة بسيطة للخروج من دائرة التوتر',
    ],
  },
  {
    id: 3,
    label: 'اليوم الثالث',
    title: 'تثبيت التغيير بالتطبيق',
    points: [
      'جلسة تطبيق وأسئلة مباشرة',
      'حالات حقيقية من المشاركات',
      'تطبيق عملي لما تعلمناه على مواقف يومية',
    ],
  },
]

const dayIcons = [SparklesIcon, LightBulbIcon, HeartIcon]

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
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="days-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="days-title" className="chl-title">تفاصيل الأيام</h2>
          <p className="chl-subtitle">رحلة 3 أيام مصممة لتناسب حياتك اليومية</p>
        </header>

        <div className="chl-days-grid">
          {DAY_PLANS.map((day, index) => {
            const Icon = dayIcons[index % dayIcons.length]
            return (
              <article key={day.id} className="chl-day-card ch-reveal-item">
                <span className="chl-day-badge">{day.id}</span>
                <p className="chl-day-label">{day.label}</p>
                <h3 className="chl-day-title">{day.title}</h3>

                <ul className="chl-day-list">
                  {day.points.map((point, idx) => (
                    <li key={idx}>{point}</li>
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
