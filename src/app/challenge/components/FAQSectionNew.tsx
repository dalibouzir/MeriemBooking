
"use client"
import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQSectionNewProps {
  faqs: { question: string; answer: string }[]
}

export default function FAQSectionNew({ faqs }: FAQSectionNewProps) {
  if (faqs.length === 0) return null;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="ch-faq-section" aria-labelledby="faq-title">
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
          {faqs.map((faq, index) => (
            <article key={`faq-${index}`} className="ch-faq-item" role="listitem">
              <div
                className={`ch-faq-trigger${openIndex === index ? ' ch-faq-trigger-open' : ''}`}
                onClick={() => handleToggle(index)}
                style={{ cursor: 'pointer' }}
                aria-expanded={openIndex === index}
                aria-controls={`faq-panel-${index}`}
                tabIndex={0}
                role="button"
              >
                <span className="ch-faq-number">{index + 1}</span>
                <span className="ch-faq-question">{faq.question}</span>
                <span className="ch-faq-icon-wrap" aria-hidden="true">
                  <ChevronDownIcon className="ch-faq-icon" />
                </span>
              </div>
              <div
                id={`faq-panel-${index}`}
                className="ch-faq-panel"
                style={{ display: openIndex === index ? 'block' : 'none' }}
              >
                <p className="ch-faq-answer">{faq.answer}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
