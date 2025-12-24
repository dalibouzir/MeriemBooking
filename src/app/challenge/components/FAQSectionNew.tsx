'use client'
interface FAQSectionNewProps {
  faqs: { question: string; answer: string }[]
}

const defaultFaqs = [
  {
    question: 'هل التحدّي مجاني بالكامل؟',
    answer: 'نعم، التحدّي مجاني بالكامل.',
  },
  {
    question: 'هل الجلسة مباشرة أم مسجّلة؟',
    answer: 'الجلسة مباشرة عبر الإنترنت في الوقت المحدد.',
  },
  {
    question: 'هل يناسب الأمهات المشغولات؟',
    answer: 'نعم، لأنه مصمم بخطوات قصيرة ومرنة تناسب وقتك.',
  },
  {
    question: 'ماذا لو لم أستطع الحضور؟',
    answer: 'يمكنك متابعة الخطوات في الوقت المناسب لك.',
  },
]

export default function FAQSectionNew({ faqs }: FAQSectionNewProps) {
  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs

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

        <div className="ch-faq-list">
          {displayFaqs.map((faq, index) => (
            <div key={index} className="ch-faq-item">
              <div className="ch-faq-item-header">
                <span className="ch-faq-number">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="ch-faq-question">{faq.question}</h3>
              </div>
              <p className="ch-faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
