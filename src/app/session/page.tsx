'use client'

import Image from 'next/image'
import Link from 'next/link'

const WHATSAPP_URL = 'https://wa.me/33665286368'

const SESSION_AUDIENCE = [
  'يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية (علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)',
  'يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته، أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها',
  'لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق (الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)',
]

const SESSION_FLOW = [
  'استخراج الكود العاطفي للمشكلة الأساسية: من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.',
  'تحويل الكود المضطرب إلى كود متزن: ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.',
]

export default function SessionPage() {
  return (
    <main className="session-page" dir="rtl">
      <section className="session-hero">
        <div className="session-hero-copy">
          <p className="session-hero-kicker">جلسة فردية للإرشاد نحو الاتزان</p>
          <h1>
            جلسة هادئة وعميقة مدّتها ساعة، مخصّصة لكل من يحتاج مساحة آمنة يفهم فيها مشاعره، ويستعيد توازنه الداخلي بخطوات واضحة ومدروسة.
          </h1>
          <div className="session-hero-actions">
            <Link href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn session-hero-btn">
              تواصلي عبر واتساب
            </Link>
            <p className="session-hero-note">جلسات سرّية، فردية، ومخصّصة لك تمامًا.</p>
          </div>
        </div>
        <div className="session-hero-image">
          <div className="session-hero-art">
            <Image
              src="/Hero.jpeg"
              alt="مريم بوزير"
              width={480}
              height={640}
              sizes="(max-width: 768px) 80vw, 460px"
              className="session-hero-img"
              priority
            />
          </div>
        </div>
      </section>

      <section className="session-details">
        <div className="session-card">
          <h2>لمن تناسب هذه الجلسة؟</h2>
          <ul>
            {SESSION_AUDIENCE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="session-card">
          <h2>ماذا نفعل داخل الجلسة؟</h2>
          <ul>
            {SESSION_FLOW.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="session-card session-card-note">
          <h2>ملاحظة مهمة</h2>
          <p>
            تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من أشكال جلد الذات.
          </p>
        </div>
      </section>

      <div className="session-cta">
        <Link href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn session-hero-btn">
          تواصلي عبر واتساب
        </Link>
      </div>
    </main>
  )
}
