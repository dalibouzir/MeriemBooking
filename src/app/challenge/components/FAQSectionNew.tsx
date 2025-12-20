'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface FAQSectionNewProps {
  faqs: { question: string; answer: string }[]
}

export default function FAQSectionNew({ faqs }: FAQSectionNewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
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
      { threshold: 0.1 }
    )

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [faqs])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (faqs.length === 0) return null

  return (
    <section ref={sectionRef} className="ch-faq-section" aria-labelledby="faq-title">
      <div className="ch-faq-container">
        <div className="ch-faq-header ch-reveal">
          <h2 id="faq-title" className="ch-section-title">
            ❓ الأسئلة الشائعة
          </h2>
          <p className="ch-section-subtitle">
            إجابات على أكثر الأسئلة تكراراً
          </p>
        </div>

        <div className="ch-faq-list" role="list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const triggerId = `faq-trigger-${index}`

            return (
              <div
                key={index}
                ref={(el) => { if (el) itemsRef.current[index] = el }}
                data-index={index}
                className={`ch-faq-item ch-reveal-item ${isOpen ? 'is-open' : ''}`}
                role="listitem"
              >
                <button
                  id={triggerId}
                  type="button"
                  className="ch-faq-trigger"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="ch-faq-number">{index + 1}</span>
                  <span className="ch-faq-question">{faq.question}</span>
                  <span className="ch-faq-icon-wrap">
                    <ChevronDownIcon className="ch-faq-icon" aria-hidden="true" />
                  </span>
                </button>
                
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="ch-faq-panel"
                  hidden={!isOpen}
                  style={{
                    maxHeight: isOpen ? '500px' : '0',
                  }}
                >
                  <p className="ch-faq-answer">{faq.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
