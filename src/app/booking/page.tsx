'use client'

import Link from 'next/link'

const BOOKING_URL = 'https://calendly.com/meriembouzir/30min'

const SESSION_AUDIENCE = [
  {
    title: 'يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية',
    detail: '(علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)',
  },
  {
    title: 'يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته',
    detail: 'أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها.',
  },
  {
    title: 'لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق',
    detail: '(الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)',
  },
]

const SESSION_STEPS = [
  {
    title: 'استخراج الكود العاطفي للمشكلة الأساسية',
    detail: 'من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.',
  },
  {
    title: 'تحويل الكود المضطرب إلى كود متزن',
    detail: 'ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.',
  },
]

export default function BookingPage() {
  return (
    <div className="booking-redirect" dir="rtl">
      <div className="booking-grid">
        <section className="booking-card booking-session-card" aria-labelledby="booking-session-title">
          <p className="booking-eyebrow">جلسة خاصة عبر مكالمة فيديو</p>
          <h1 id="booking-session-title">جلسة فردية للإرشاد نحو الاتزان</h1>
          <p className="booking-lede">
            جلسة هادئة وعميقة مدّتها ساعة، مخصّصة لكل من يحتاج مساحة آمنة يفهم فيها مشاعره، ويستعيد توازنه الداخلي بخطوات واضحة ومدروسة.
          </p>

          <div className="booking-session-divider" aria-hidden />

          <div className="booking-session-block">
            <h2>لمن تناسب هذه الجلسة؟</h2>
            <ul className="booking-session-list">
              {SESSION_AUDIENCE.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="booking-session-block">
            <h2>ماذا نفعل داخل الجلسة؟</h2>
            <ul className="booking-session-list">
              {SESSION_STEPS.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="booking-session-note" role="note">
            <p className="booking-session-note-title">ملاحظة مهمة</p>
            <p>
              تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من أشكال جلد الذات.
            </p>
          </div>

          <Link
            href={BOOKING_URL}
            className="btn btn-primary booking-btn booking-session-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            احجزي جلستك
          </Link>
          <p className="booking-reassure">جلسات سرّية، فردية، ومخصّصة لك تمامًا.</p>
        </section>

        <aside className="booking-card booking-how-card" aria-labelledby="booking-how-title">
          <h2 id="booking-how-title">كيف يتم تأكيد الموعد؟</h2>
          <p>
            يتم تنسيق الجلسات عبر Calendly لضمان حجز منظم وتذكيرات تلقائية. اتبعي الخطوات التالية لتأكيد جلستك في أقل من دقيقة.
          </p>
          <ol className="booking-steps">
            <li>اضغطي زر &quot;احجزي جلستك&quot; وسيُفتح لك رابط Calendly في نافذة جديدة.</li>
            <li>اختاري التوقيت الذي يناسبك، ثم عبّئي بيانات التواصل المطلوبة.</li>
            <li>سيصلك تأكيد فوري عبر البريد، مع رابط مكالمة الفيديو وتذكير تلقائي قبل الموعد.</li>
          </ol>
          <p className="booking-note-text">
            في حال احتجتِ تعديل الموعد أو لديك سؤال إضافي، يمكنك الرد على رسالة التأكيد مباشرة وسأعاود التواصل معك في أقرب وقت.
          </p>
        </aside>
      </div>
    </div>
  )
}
