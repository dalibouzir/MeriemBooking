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
  RocketLaunchIcon
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

  // Default benefits if none provided
  const displayBenefits = benefits.length > 0 ? benefits : [
    'خطة تغذية مخصصة تناسب نمط حياتك',
    'تمارين منزلية بسيطة وفعّالة',
    'دعم مجتمعي من أمهات مثلك',
    'متابعة يومية ونصائح عملية',
    'أدوات تتبع التقدم والإنجازات',
    'وصفات صحية سريعة التحضير',
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
            ✨ ماذا ستحصلين عليه؟
          </h2>
          <p className="ch-section-subtitle">
            كل ما تحتاجينه لبدء رحلة التغيير في مكان واحد
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
