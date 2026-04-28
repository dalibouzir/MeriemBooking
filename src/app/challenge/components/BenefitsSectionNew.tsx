'use client'

import { useEffect, useRef } from 'react'
import {
  CheckCircleIcon,
  SparklesIcon,
  HeartIcon,
  LightBulbIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'

interface BenefitsSectionNewProps {
  benefits: string[]
}

const benefitIcons = [
  CheckCircleIcon,
  SparklesIcon,
  HeartIcon,
  LightBulbIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  RocketLaunchIcon,
]

export default function BenefitsSectionNew({ benefits }: BenefitsSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      itemsRef.current.forEach((el) => el?.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const index = parseInt(el.dataset.index || '0', 10)
            setTimeout(() => {
              el.classList.add('is-revealed')
            }, index * 80)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [benefits])

  const displayBenefits = benefits.length > 0 ? benefits : [
    'لماذا تفقدين السيطرة رغم أنك تعرفين ما هو الصواب.',
    'ما الذي يحرّك ردّة فعلك من الداخل.',
    'لماذا يتكرّر نفس النمط رغم محاولاتك المتكررة.',
  ]

  return (
    <section
      ref={sectionRef}
      id="challenge-benefits"
      className="ch-benefits-section"
      aria-labelledby="benefits-title"
    >
      <div className="ch-benefits-container">
        <div className="ch-benefits-header ch-reveal">
          <h2 id="benefits-title" className="ch-section-title">
            ماذا يعني هذا التحدّي؟
          </h2>
          <p className="ch-section-subtitle">
            هذا التحدي ليس مجرد نصائح عابرة، بل مساحة صادقة ترين فيها نفسك بوضوح.
          </p>
          <p className="ch-section-subtitle">
            وتفهمين لأول مرة أشياء ربما لم تنتبهي لها من قبل.
          </p>
        </div>

        <div className="ch-benefits-grid">
          {displayBenefits.map((benefit, index) => {
            const IconComponent = benefitIcons[index % benefitIcons.length]
            return (
              <div
                key={index}
                ref={(el) => { if (el) itemsRef.current[index] = el }}
                data-index={index}
                className="ch-benefit-card ch-reveal-item"
              >
                <div className="ch-benefit-icon-wrap">
                  <IconComponent className="ch-benefit-icon" aria-hidden="true" />
                </div>
                <p className="ch-benefit-text">{benefit}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
