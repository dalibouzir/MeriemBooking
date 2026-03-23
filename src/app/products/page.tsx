import { type CSSProperties } from 'react'
import Link from 'next/link'
import Accordion from '@/components/ui/Accordion'
import ChatbotWidget from '@/components/ChatbotWidget'
import ProductsLibraryClient from './ProductsLibraryClient'
import ProductWhoForSection from './ProductWhoForSection'

const FLOW_STEPS = [
  {
    id: 'pick',
    title: 'اختاري الملف المثالي',
    detail: 'تصفيح سريع حسب عمر الطفل أو تحدياتك الحالية ثم اختيار الملف بنقرة واحدة.',
  },
  {
    id: 'unlock',
    title: 'استلام الرابط فورًا',
    detail: 'فور الضغط على تحميل تحصلين على رابط مباشر يصل لبريدك مع تأكيد جلسة تعريفية مجانية.',
  },
  {
    id: 'print',
    title: 'جلسات مطبوعة جاهزة',
    detail: 'اطبعي أو استعملي الملف رقميًا، وكل الموارد تبقى داخل حسابك للرجوع لها لاحقًا.',
  },
]

const FAQ_ITEMS = [
  {
    id: 'download',
    title: 'كيف أحمّل الملف بعد اختياره؟',
    content:
      'تظهر لك نافذة تحتوي على الرابط المباشر فور الضغط على زر التحميل، ويصل الرابط نفسه إلى بريدك خلال دقائق للحفظ.',
  },
  {
    id: 'session',
    title: 'هل تشمل الملفات جلسة تعريفية؟',
    content:
      'كل تحميل يمنحك جلسة تعريفية مجانية مع مريم بوزير يمكنك إهداؤها لصديقة تحتاج للدعم.',
  },
  {
    id: 'access',
    title: 'هل سأفقد الملفات لاحقًا؟',
    content:
      'لا. جميع الملفات تبقى في حسابك ويمكنك إعادة تنزيلها متى شئت، كما نرسل أي تحديثات أو نسخ منقحة لنفس البريد.',
  },
]

const CTA_ROUTE = '/download'

export default function ProductsPage() {
  return (
    <main className="library-page" dir="rtl">
      <ProductsLibraryClient />
      {/* Product WhoFor Section */}
      <section className="library-whofor" style={{ marginTop: 32 }}>
        <div className="library-section-head appear-on-scroll">
          <ProductWhoForSection />
        </div>
      </section>

      <section id="library-workflow" className="library-flow" aria-labelledby="library-flow-title">
        <div className="library-section-head appear-on-scroll" style={{ '--delay': '0.14s' } as CSSProperties}>
          <div>
            <h2 id="library-flow-title">كيف تعمل التنزيلات؟</h2>
            <p>ثلاث خطوات متتالية تنتهي بملف مطبوع وجلسة تعريفية مجانية.</p>
          </div>
        </div>
        <p className="library-flow-hint appear-on-scroll" style={{ '--delay': '0.16s' } as CSSProperties}>
          اسحبي لليمين واليسار لاستعراض الخطوات
        </p>
        <div className="library-flow-steps">
          {FLOW_STEPS.map((step, index) => (
            <article
              key={step.id}
              className="library-flow-step appear-on-scroll"
              style={{ '--delay': `${0.16 + index * 0.05}s` } as CSSProperties}
            >
              <span className="library-flow-step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
        <div className="library-support-box">
          <strong>لو واجهتك أي مشكلة في التحميل</strong>
          <p>
            راسلينا مباشرة على
            {' '}
            <a href="mailto:meriembouzir05@gmail.com" className="ltr-text">
              meriembouzir05@gmail.com
            </a>
            {' '}أو افتحي الدردشة أسفل الصفحة.
          </p>
        </div>
      </section>

      <section className="library-faq" aria-labelledby="library-faq-title">
        <div className="library-section-head appear-on-scroll" style={{ '--delay': '0.26s' } as CSSProperties}>
          <div>
            <h2 id="library-faq-title">أسئلة مختصرة</h2>
            <p>كل الإجابات في بطاقة واحدة قابلة للطي حتى على الهاتف.</p>
          </div>
        </div>
        <Accordion items={FAQ_ITEMS} allowMultiple={false} />
      </section>

      <ChatbotWidget />

      <div className="library-sticky-cta" aria-live="polite">
        <span>كل الملفات مجانية للتحميل</span>
        <Link href={CTA_ROUTE}>ابدئي الآن</Link>
      </div>
    </main>
  )
}
