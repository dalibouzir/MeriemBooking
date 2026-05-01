'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface WhoForSectionNewProps {
  targetAudience: string[]
  notFor: string[]
}

export default function WhoForSectionNew({ targetAudience, notFor }: WhoForSectionNewProps) {
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
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="chl-section ch-reveal" aria-labelledby="checklist-title">
      <div className="chl-wrap">
        <header className="chl-heading">
          <h2 id="checklist-title" className="chl-title">ماذا ستحصلين عليه؟</h2>
          <p className="chl-subtitle">خلال هذه الأيام الثلاثة، لن نطلب منك أن تكوني مثالية</p>
        </header>

        <div className="chl-checklist-box">
          <p className="chl-script-intro">بل ستبدئين بـ:</p>
          <ul className="chl-checklist-list">
            {targetAudience.map((text) => (
              <li key={text} className="chl-checklist-row">
                <p>{text}</p>
                <span className="chl-check-icon-wrap" aria-hidden="true">
                  <CheckCircleIcon className="chl-check-icon" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="chl-script-note">👉 هذه ليست نهاية التغيير…<br />لكنها بداية صادقة وواقعية له</p>
      </div>

      <section className="landing-section landing-bio reveal is-inview chl-identity-merge" aria-labelledby="landing-bio-title">
        <div className="landing-bio-card chl-identity-merge-card">
          <div className="chl-identity-message">
            <h2 className="chl-title">لستِ وحدك</h2>
            <p className="chl-alone-text">
              {notFor[0]}
              <br />
              {notFor[1]}
              <br />
              {notFor[2]}
            </p>
          </div>

          <div className="landing-bio-figure">
            <Image src="/Meriem.jpeg" alt="مريم بوزير" width={176} height={176} className="landing-bio-avatar" loading="lazy" />
            <div className="landing-bio-meta">
              <p className="landing-bio-name">مريم بوزير</p>
              <p className="landing-bio-role">مرشدة في الاتزان العاطفي والعلاقات</p>
            </div>
          </div>

          <div className="landing-bio-body">
            <h2 id="landing-bio-title">من أنا؟</h2>
            <p>أنا مريم بوزير، أمّ لطفلتين، تونسية أتنقّل بين تونس وفرنسا.</p>
            <p>
              هاجرتُ إلى فرنسا لاستكمال دراستي العليا في مجال صناعة الأدوية، لكنّ الأمومة كانت نقطة التحوّل الكبرى
              في حياتي؛ مرحلة حملت الكثير من الإرهاق، وتكرار الأمراض، وضباب المشاعر، وفقدان الاتصال بالذات، والتراجع
              عن الأهداف.
            </p>
            <p>
              هذا المنعطف دفعني للبحث بعمق عن جذور التعب النفسي والعضوي. درستُ المشاعر لمدة ثلاث سنوات، وتعمّقت في فهم
              كيف يقف خلف كل ألم — نفسي أو عضوي — شعور لم يُفهم بعد ولم يُسمَع صوته.
            </p>
            <p>
              إلى جانب خلفيتي العلمية، تابعتُ دبلومًا في الإرشاد الأسري والعلاقات، وبدأتُ أوّلًا ممارسة ما تعلّمته داخل
              أسرتي، ثم تحوّل ما عشته من تغيير إلى رسالة أعيشها كل يوم:
            </p>
            <blockquote className="landing-bio-quote-card" aria-label="رسالة مريم بوزير">
              <p>
                “دعم النساء نحو الاتزان، وإرشادهن شعوريًا، وبالأخصّ مرافقة الأمهات لاستعادة حياتهن بوعي وطمأنينة.”
              </p>
            </blockquote>
          </div>
        </div>
      </section>
    </section>
  )
}
