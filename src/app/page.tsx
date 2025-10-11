'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import Accordion from '@/components/ui/Accordion'
import ChatbotWidget from '@/components/ChatbotWidget'
import {
  mapLibraryItems,
  mapLegacyProducts,
  type LibraryItemRow,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'

const FAQ_SNIPPET = [
  {
    id: 'gift-code',
    title: 'كيف أستخدم رمز المكالمة المجانية؟',
    content:
      'بعد تحميل أي مورد يُرسَل إليك رمز له صلاحية 30 يومًا. انتقلي إلى صفحة “استبدال الرمز” وأدخليه ثم اختاري الموعد الذي يناسبك.',
  },
  {
    id: 'download-access',
    title: 'هل يمكنني إعادة تحميل الملف لاحقًا؟',
    content:
      'بالطبع. وصلك بريد يحتوي على رابط دائم، كما يمكنك العودة إلى صفحة التنزيل مع نفس البريد الإلكتروني لتحميل الملف متى شئت.',
  },
  {
    id: 'sessions',
    title: 'ما الفرق بين الجلسة المجانية والمدفوعة؟',
    content:
      'المجانية مخصّصة لتقييم الوضع الحالي وتقديم خطة أولية. الجلسة المدفوعة أعمق وتشمل متابعة أسبوعية وملف ملخّص بالتوصيات.',
  },
]

const HERO_FACTS = [
  '👩🏻‍🔬 أم | 🎓 ماجستير كيمياء أدوية | 🌿 مرشدة اتزان شعوري',
  'أرشدك نحو 🤍 أم مطمئنة 🌸 مستمتعة بأنوثتها ودورها',
  '🤝 علاقات صحية | ✨ مساحة حقيقية بلا تكلّف',
]

const JOURNEY_STEPS = [
  { id: 1, icon: '🎯', title: 'نحدد الهدف', text: 'جلسة تعريفية لالتقاط صورة دقيقة عن بيتك ومشاعرك.' },
  { id: 2, icon: '📝', title: 'نرسم خطة صغيرة', text: 'تصميم خطوات أسبوعية قابلة للتنفيذ دون ضغط.' },
  { id: 3, icon: '🧠', title: 'نطبّق ونتابع', text: 'تطبيقات CBT وأدوات تهدئة مدعومة بالملفات الرقمية.' },
  { id: 4, icon: '🌱', title: 'نحتفل بالتقدّم', text: 'نقيس التغيير ونثبت العادات داخل الأسرة.' },
]

const BOOKING_ROUTE = '/free-call'
const BOOKING_URL = BOOKING_ROUTE

type SocialLink = {
  href: string
  label: string
  icon: string
  variant?: 'linktree'
}

const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://linktr.ee/meriembouzir', label: 'لينك تري', icon: '🌿', variant: 'linktree' },
  { href: 'https://www.instagram.com/fittrah.moms', label: 'إنستغرام', icon: '📸' },
  { href: 'https://www.youtube.com/@fittrahmoms', label: 'يوتيوب', icon: '▶️' },
  { href: 'https://wa.me/21629852313', label: 'واتساب', icon: '💬' },
]

export default function HomePage() {
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error: libraryError } = await supabaseClient
          .from('library_items')
          .select('*')
          .order('created_at', { ascending: false })
        if (!libraryError && Array.isArray(data)) {
          const mapped = await mapLibraryItems(data as LibraryItemRow[])
          if (!cancelled) setResources(mapped)
          return
        }
        const fallback = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fallback.error && Array.isArray(fallback.data)) {
          const mapped = mapLegacyProducts(fallback.data as LegacyProductRow[])
          if (!cancelled) setResources(mapped)
          return
        }
        if (!cancelled) setError('تعذّر تحميل الموارد حاليًا. أعيدي المحاولة بعد قليل.')
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('حدث خطأ غير متوقع. الرجاء المحاولة لاحقًا.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResources()
    return () => {
      cancelled = true
    }
  }, [])

  const downloads = useMemo(() => resources.slice(0, 6), [resources])
  const newestProducts = useMemo(() => resources.slice(0, 5), [resources])
  const activeProduct = newestProducts[0] ?? null
  const bookSummary = activeProduct ? activeProduct.description || activeProduct.snippet || '' : ''
  const bookExtra =
    activeProduct && activeProduct.snippet && activeProduct.snippet !== bookSummary ? activeProduct.snippet : null
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const handleScrollToDownloads = useCallback(() => {
    const el = document.getElementById('downloads')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="home-page">
      <section className="therapist-hero" aria-labelledby="hero-title">
        <div className="hero-spotlight">
          <div className="hero-texture" aria-hidden />
          <div className="hero-portrait">
            <Image
              src="/Meriem.webp"
              alt="مريم بوزير — مرافقة الأمهات"
              width={220}
              height={280}
              className="hero-photo"
              priority
            />
            <span className="hero-bookmark" aria-hidden />
          </div>
          <div className="hero-content">
            <span className="hero-name" id="hero-title">
              مريم بوزير
            </span>
            <h1>أرشدك نحو أمومة مطمئنة، مليئة بالأنوثة والسكينة.</h1>
            <ul className="hero-facts">
              {HERO_FACTS.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="hero-lead">
              نشتغل معًا على إعادة الاتزان الشعوري داخل البيت، برحلة صادقة تحفظ حضورك كأم وتمنحك مساحة للتنفس.
            </p>
            <div className="hero-actions">
              <Link href={BOOKING_ROUTE} className="btn hero-primary">
                اطلبي جلسة تعريفية
              </Link>
              <button type="button" className="hero-secondary" onClick={handleScrollToDownloads}>
                شاهدي الرحلة خطوة بخطوة
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="journey-section">
        <div className="journey-intro">
          <p>نمشي معًا خطوة بخطوة، مع ترك مساحة لكِ لتلتقطي أنفاسك وتستمتعي بأسرتك.</p>
        </div>
        <div className="journey-grid">
          {JOURNEY_STEPS.map((step) => (
            <article key={step.id} className="journey-card">
              <span className="journey-icon" aria-hidden>
                {step.icon}
              </span>
              <h3>
                {step.id}. {step.title}
              </h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="downloads" className="downloads-section">
        <div className="downloads-hero">
          <div className="downloads-hero-copy">
            <p className="downloads-lead">كل ملف يحتوي على تمارين جاهزة، جداول للطباعة، وخطوات لطيفة تزيد هدوء البيت.</p>
            <div className="downloads-headline">
              <span>طريقك نحو أمومة أكثر هدوءًا وتوازنًا</span>
              <h2>طريقك نحو أمومة أكثر هدوءًا وتوازنًا</h2>
            </div>
            <p className="downloads-description">
              من خلال صفحاته، ستكتشفين كيف: تفهمين مشاعرك وتتعاملين معها بوعي وهدوء. تستعيدين اتصالك بأنوثتك الحقيقية
              بعيدًا عن الإرهاق والتصنّع. تضعين حدودًا واضحة وتحميْن طاقتك من العلاقات السامة أو المستنزِفة.
            </p>
            {!loading && activeProduct && (
              <div className="book-highlight">
                <span className="book-slug">المعرّف: {activeProduct.slug}</span>
                {bookSummary && <p className="book-summary">{bookSummary}</p>}
                {bookExtra && <p className="book-snippet">{bookExtra}</p>}
                <div className="book-highlight-actions">
                  <Link href={`/download?product=${activeProduct.slug}`} className="btn book-highlight-primary">
                    تصفّحي الملف
                  </Link>
                </div>
              </div>
            )}
          </div>
          {!loading && activeProduct && (
            <div className="downloads-cover">
              <span className="downloads-cover-light" aria-hidden />
              <span className="downloads-cover-spine" aria-hidden />
              <Image
                src={activeProduct.cover || '/Meriem.webp'}
                alt={activeProduct.title}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="downloads-cover-image"
              />
            </div>
          )}
        </div>
        {loading ? (
          <div className="downloads-skeletons" aria-hidden>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="downloads-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="downloads-grid">
            {downloads.map((item) => (
              <article key={item.id} className="download-card">
                <div className="download-thumb">
                  <span className="download-thumb-shadow" aria-hidden />
                  <span className="download-thumb-spine" aria-hidden />
                  <Image
                    src={item.cover || '/Meriem.webp'}
                    alt={item.title}
                    fill
                    sizes="(max-width: 680px) 100vw, 220px"
                  />
                </div>
                <div className="download-content">
                  <Link href={`/download?product=${item.slug}`} className="download-title">
                    {item.title}
                  </Link>
                  <p>{item.snippet || item.description}</p>
                  <span className="download-tag">
                    {item.type === 'فيديو' ? 'فيديو' : item.format?.includes('PDF') ? 'ملف PDF' : 'ملف رقمي'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="call-to-action">
        <div className="cta-body">
          <header>
            <span className="cta-kicker">جلسة تعريفية مدتها 30 دقيقة</span>
            <h2>اطلبي مكالمة مجانية لنضع معًا أول خطوة هادئة</h2>
          </header>
          <p>
            شاركيني ما يحدث في بيتك، وسنرسم معًا أول أسبوع عملي. المكالمة مجانية وتفتح لك إمكانية تحميل كل الملفات المجانية
            مباشرة.
          </p>
          <div className="cta-actions">
            <Link href={BOOKING_ROUTE} className="btn cta-primary">
              اطلبي جلسة مجانية
            </Link>
            <Link href="/products" className="btn cta-secondary">
              تصفّحي المكتبة
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-grid">
          <div className="home-footer-column">
            <h3>كل الروابط في مكان واحد</h3>
            <div className="home-social-list">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`home-social-link${link.variant ? ` ${link.variant}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden>{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="home-footer-column">
            <h3>تواصل سريع</h3>
            <ul className="home-contact-list">
              <li>
                <a href="mailto:meriembouzir05@gmail.com">meriembouzir05@gmail.com</a>
              </li>
              <li>
                <a href="https://wa.me/21629852313" target="_blank" rel="noopener noreferrer">
                  واتساب مباشر: ‎+216 29 852 313
                </a>
              </li>
              <li>
                <Link href="/free-call">طلب جلسة تعريفية</Link>
              </li>
            </ul>
          </div>

          <div className="home-footer-column">
            <h3>أسئلة سريعة</h3>
            <Accordion items={FAQ_SNIPPET} defaultOpenIds={[FAQ_SNIPPET[0].id]} />
          </div>
        </div>

        <div className="home-footer-legal">
          <div className="home-legal-links">
            <Link href="/policy">الشروط</Link>
            <span className="home-legal-divider">|</span>
            <Link href="/privacy">الخصوصية</Link>
            <span className="home-legal-divider">|</span>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              حجوزات Calendly
            </a>
          </div>
          <p className="home-footer-copy">© {currentYear} Fittrah Moms. جميع الحقوق محفوظة.</p>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  )
}
