'use client'

import { useEffect, useRef } from 'react'
import {
  HeartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  StarIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline'

interface BenefitsSectionNewProps {
  benefits: string[]
}

type Feature = {
  title: string
  desc: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const FEATURES: Feature[] = [
  {
    title: 'توازن بين العقل والإحساس',
    desc: 'تفهمين ما يحدث داخلك بوضوح وهدوء عملي.',
    Icon: PuzzlePieceIcon,
  },
  {
    title: 'خطوات بسيطة للعناية بنفسك',
    desc: 'عادات صغيرة قابلة للتطبيق وسط ضغط اليوم.',
    Icon: SparklesIcon,
  },
  {
    title: 'تنظيم مشاعرك بدون جلد الذات',
    desc: 'تتعاملين مع التوتر بلطف ووعي أعلى.',
    Icon: HeartIcon,
  },
  {
    title: 'وضوح لما يحرّك الانفعال',
    desc: 'تفهمين جذور ردّة الفعل بدل تكرارها.',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'دعم وتشجيع في بيئة آمنة',
    desc: 'مساحة مفهومة تساعدك على الاستمرار.',
    Icon: LightBulbIcon,
  },
  {
    title: 'بداية واقعية للتغيير',
    desc: 'ليست مثالية، لكنها خطوة صادقة فعّالة.',
    Icon: StarIcon,
  },
]

export default function BenefitsSectionNew({ benefits }: BenefitsSectionNewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLElement[]>([])
  void benefits

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
            setTimeout(() => el.classList.add('is-revealed'), index * 70)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15 }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="challenge-benefits" className="chl-section chl-features" aria-labelledby="benefits-title">
      <div className="chl-wrap">
        <header className="chl-heading ch-reveal">
          <h2 id="benefits-title" className="chl-title">ماذا يعني هذا التحدي؟</h2>
          <p className="chl-subtitle">٣ أيام قصيرة، لكنها بداية تغيير حقيقي من الداخل</p>
        </header>

        <div className="chl-features-grid">
          {FEATURES.map(({ title, desc, Icon }, index) => (
            <article
              key={title}
              ref={(el) => { if (el) itemsRef.current[index] = el }}
              data-index={index}
              className="chl-feature-card ch-reveal-item"
            >
              <span className="chl-feature-icon-wrap" aria-hidden="true">
                <Icon className="chl-feature-icon" />
              </span>
              <h3 className="chl-feature-title">{title}</h3>
              <p className="chl-feature-desc">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
