'use client'

import { useEffect, useRef } from 'react'

interface WhoForSectionNewProps {
  targetAudience: string[]
  notFor: string[]
}

export default function WhoForSectionNew({ targetAudience, notFor }: WhoForSectionNewProps) {
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
            }, index * 60)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1 }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [targetAudience, notFor])

  const displayTargetAudience = targetAudience.length > 0 ? targetAudience : [
    'فهم حقيقي لما يحدث داخلك في لحظة الضغط.',
    'وعي trigger أساسي يسبب أغلب توترك.',
    'تعلّم استراتيجيات وتمارين بسيطة لتغيير ردّة فعلك.',
  ]

  const displayNotFor = notFor.length > 0 ? notFor : [
    'هذا التحدي ليس فقط محتوى، بل مساحة تشعرين فيها أنك مفهومة.',
    'ما تعيشينه ليس ضعفًا… بل نمط يمكن فهمه وتغييره.',
    'هذه ليست نهاية التغيير… لكنها بداية صادقة وواقعية له.',
  ]

  const targetAudienceItems = displayTargetAudience.map((item, index) => ({
    text: item,
    dataIndex: index,
  }))

  const notForItems = displayNotFor.map((item, index) => ({
    text: item,
    dataIndex: displayTargetAudience.length + index,
  }))

  return (
    <section ref={sectionRef} className="ch-whofor-section" aria-labelledby="whofor-title">
      <div className="ch-whofor-container">
        <div className="ch-whofor-header ch-reveal">
          <h2 id="whofor-title" className="ch-section-title">
            ماذا ستحصلين عليه؟
          </h2>
          <p className="ch-section-subtitle">
            خلال هذه الأيام الثلاثة، لن نطلب منك أن تكوني مثالية… بل أن تبدئي بخطوات واقعية.
          </p>
        </div>

        <div className="ch-whofor-grid">
          <div className="ch-whofor-col ch-whofor-col-yes">
            <h3 className="ch-whofor-col-title">
              <span className="ch-whofor-col-icon">✓</span>
              ستبدئين بـ
            </h3>
            <div className="ch-whofor-list">
              {targetAudienceItems.map((item, index) => {
                return (
                  <div
                    key={index}
                    ref={(el) => { if (el) itemsRef.current[item.dataIndex] = el }}
                    data-index={item.dataIndex}
                    className="ch-whofor-item ch-whofor-item-yes ch-reveal-item"
                  >
                    <span className="ch-whofor-item-icon" aria-hidden="true">✓</span>
                    <span className="ch-whofor-item-text">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="ch-whofor-col ch-whofor-col-yes">
            <h3 className="ch-whofor-col-title">
              <span className="ch-whofor-col-icon">♥</span>
              لستِ وحدك
            </h3>
            <div className="ch-whofor-list">
              {notForItems.map((item, index) => {
                return (
                  <div
                    key={index}
                    ref={(el) => { if (el) itemsRef.current[item.dataIndex] = el }}
                    data-index={item.dataIndex}
                    className="ch-whofor-item ch-whofor-item-yes ch-reveal-item"
                  >
                    <span className="ch-whofor-item-icon" aria-hidden="true">•</span>
                    <span className="ch-whofor-item-text">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
