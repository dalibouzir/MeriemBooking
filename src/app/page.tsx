'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Accordion from '@/components/ui/Accordion'
import ChatbotWidget from '@/components/ChatbotWidget'
import { supabaseClient } from '@/lib/supabase'
import {
  mapLibraryItems,
  mapLegacyProducts,
  type LibraryItemRow,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'

const BOOKING_ROUTE = '/free-call'
const PRODUCTS_ROUTE = '/products'

const HERO_FACTS = [
  '👩🏻‍🔬 أم | 🎓 ماجستير كيمياء أدوية | 🌿 مرشدة اتزان شعوري',
  'أرشدك نحو 🤍 أم مطمئنة 🌸 مستمتعة بأنوثتها ودورها',
  '🤝 علاقات صحية | ✨ مساحة حقيقية بلا تكلّف',
]

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

const JOURNEY_STEPS = [
  { id: 1, icon: '🎯', title: 'نحدد الهدف', text: 'جلسة تعريفية لالتقاط صورة دقيقة عن بيتك ومشاعرك.' },
  { id: 2, icon: '📝', title: 'نرسم خطة صغيرة', text: 'تصميم خطوات أسبوعية قابلة للتنفيذ دون ضغط.' },
  { id: 3, icon: '🧠', title: 'نطبّق ونتابع', text: 'تطبيقات CBT وأدوات تهدئة مدعومة بالملفات الرقمية.' },
  { id: 4, icon: '🌱', title: 'نحتفل بالتقدّم', text: 'نقيس التغيير ونثبت العادات داخل الأسرة.' },
]

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

type LandingDisplay = {
  id: string
  title: string
  description: string
  cover: string
  meta?: string
  href?: string
}

type LandingProfile = {
  cover: string
  title: string
  meta: string
}

const FALLBACK_SHOWCASE: LandingDisplay = {
  id: 'showcase-fallback',
  title: 'ملف العودة للسكينة',
  description: 'ملف عملي يعيد ترتيب يوم الأم ويمنحك خطوات صغيرة تخلق سلامًا داخل البيت.',
  cover:
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1074&q=80',
  meta: 'كتاب PDF · 12 صفحة',
  href: PRODUCTS_ROUTE,
}

/** Force Meriem’s real photo */
const PROFILE_IMAGE = '/meriem.webp'
const FALLBACK_PROFILE: LandingProfile = {
  cover: PROFILE_IMAGE,
  title: 'مريم بوزير',
  meta: 'جلسة تعريفية مجانية',
}

const FALLBACK_FEATURES: LandingDisplay[] = [
  {
    id: 'feature-1',
    title: 'ملهمة الاتزان الهادئ',
    description: 'جدول يومي يجمع بين الرعاية الذاتية والتواصل اللطيف مع الأبناء.',
    cover:
      'https://i.ibb.co/RhpnYWV/Enis-cyberpunk-ottoman-sultan-in-a-cyberpunk-city-8-K-hyperreali-e7506c88-2574-487c-838e-5bb8618dd1c.png',
    meta: 'كتاب PDF',
    href: PRODUCTS_ROUTE,
  },
  {
    id: 'feature-2',
    title: 'حوار أم وابنتها',
    description: 'نموذج جاهز لفتح مساحة حديث آمنة داخل البيت.',
    cover:
      'https://i.ibb.co/SrNRC0b/Erkan-Erdil-angry-soviet-officer-shouting-his-soldiers8k-octane-7b802966-9d4e-4c6e-ac37-d4f751419081.png',
    meta: 'جلسة تطبيقية',
    href: PRODUCTS_ROUTE,
  },
  {
    id: 'feature-3',
    title: 'إعادة وصل الزوجين',
    description: 'خطوات قصيرة للحفاظ على وئام العلاقة وسط الضغوط اليومية.',
    cover:
      'https://i.ibb.co/YjzSzjk/Erkan-Erdil-very-technical-and-detailed-blueprint-of-wolf-carve-bd937607-6a4f-4525-b4f2-b78207e64662.png',
    meta: 'كتاب PDF',
    href: PRODUCTS_ROUTE,
  },
  {
    id: 'feature-4',
    title: 'جلسة تهدئة مسائية',
    description: 'تأمل صوتي يساعدك على تهدئة التوتر قبل النوم.',
    cover:
      'https://i.ibb.co/VLfJ41h/MR-ROBOT-two-cyberpunk-cowboys-dueling-6ae4203d-3539-4033-a9d9-80d747ac6498.png',
    meta: 'جلسة صوتية',
    href: PRODUCTS_ROUTE,
  },
]

function mapResourceToDisplay(resource: ProductResource): LandingDisplay {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.snippet || resource.description,
    cover: resource.cover,
    meta: resource.format
      ? `${resource.format}${resource.duration ? ` · ${resource.duration}` : ''}`
      : resource.duration || resource.type,
    href: resource.slug ? `/download?product=${resource.slug}` : `/download?product=${resource.id}`,
  }
}

function shouldOptimizeImage(src: string): boolean {
  if (!src.startsWith('http')) return true
  try {
    const { hostname } = new URL(src)
    if (hostname.endsWith('supabase.co') || hostname.endsWith('supabase.in')) return true
    if (hostname === 'cdn.apartmenttherapy.info' || hostname === 'blogger.googleusercontent.com') return true
    return false
  } catch {
    return false
  }
}

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

        if (!cancelled) setError('تعذّر تحميل الموارد حاليًا. حاولي مجددًا بعد قليل.')
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

  const showcaseResource = useMemo(() => resources[0] ?? null, [resources])
  const featuredItems = useMemo(() => resources.slice(0, 4), [resources])
  const totalResources = resources.length
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  const showcaseDisplay = showcaseResource ? mapResourceToDisplay(showcaseResource) : FALLBACK_SHOWCASE

  // Always use Meriem’s real image for the profile chip
  const profileDisplay = {
    cover: PROFILE_IMAGE,
    title: 'مريم بوزير',
    meta: 'جلسة تعريفية مجانية',
  }

  const featuredDisplay = featuredItems.length ? featuredItems.map(mapResourceToDisplay) : FALLBACK_FEATURES

  const handleScrollToFeatured = useCallback(() => {
    const el = document.getElementById('landing-hot')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <>
      <main className="landing-root" role="main">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-box">
            <div className="landing-hero-info">
              <span className="landing-hero-kicker">منصة Fittrah Moms</span>
              <h1 id="landing-hero-title">اكتشفي مكتبة مريم الرقمية، مساحة تلهمك للسكينة والأنوثة الطمأنة.</h1>
              <p className="landing-hero-lead">
                ملفات مجانية، جلسات تعريفية، وجداريات جاهزة للطباعة تساعدك على إدارة البيت المشاعري بحب ووعي.
              </p>
              <ul className="landing-hero-facts">
                {HERO_FACTS.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
              <div className="landing-hero-actions">
                <button type="button" className="landing-btn landing-btn-primary" onClick={handleScrollToFeatured}>
                  استكشفي الملفات
                </button>
                <Link href={BOOKING_ROUTE} className="landing-btn landing-btn-secondary">
                  احجزي جلسة مجانية
                </Link>
              </div>
            </div>

            <div className="landing-hero-display">
              <div className="landing-hero-art">
                <Image
                  src={showcaseDisplay.cover}
                  alt={showcaseDisplay.title}
                  fill
                  sizes="(max-width: 1024px) 70vw, 520px"
                  className="landing-hero-image"
                  priority
                  unoptimized={!shouldOptimizeImage(showcaseDisplay.cover)}
                />
              </div>
              <div className="landing-hero-profile">
                <Image
                  src={profileDisplay.cover}
                  alt={profileDisplay.title}
                  width={48}
                  height={48}
                  className="landing-hero-profile-avatar"
                  unoptimized={!shouldOptimizeImage(profileDisplay.cover)}
                />
                <div className="landing-hero-profile-copy">
                  <p>{profileDisplay.title}</p>
                  <span>{profileDisplay.meta}</span>
                </div>
              </div>
              <div className="landing-hero-metric">
                <p>{showcaseDisplay.title}</p>
                <div className="landing-hero-metric-footer">
                  <span>{showcaseDisplay.meta ?? 'ملف رقمي'}</span>
                  <div className="landing-hero-favorites">
                    <svg width="22" height="20" viewBox="0 0 22 20" aria-hidden>
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.7365 2C3.6575 2 1.5 3.8804 1.5 6.5135c0 3.1074 2.3236 5.9603 4.8612 8.1207 1.2458 1.0606 2.4954 1.9137 3.4352 2.5022.4692.2937.8593.5203 1.1305.6727L11 17.85l.0731-.0409a27.984 27.984 0 0 0 1.1304-.6727c.9399-.5885 2.1895-1.4416 3.4353-2.5022C18.1764 12.4738 20.5 9.6209 20.5 6.5135 20.5 3.8805 18.3425 2 16.2635 2c-2.1054 0-3.8008 1.389-4.552 3.6426a.75.75 0 0 1-1.423 0C9.5373 3.389 7.8418 2 5.7365 2ZM11 18.7027l.3426.6672a.7502.7502 0 0 1-.6852 0L11 18.7027ZM0 6.5135C0 3.052 2.829.5 5.7365.5 8.0298.5 9.8808 1.7262 11 3.6048 12.1192 1.7262 13.9702.5 16.2635.5 19.171.5 22 3.052 22 6.5135c0 3.8183-2.8014 7.06-5.3888 9.2628-1.3167 1.121-2.6296 2.0166-3.6116 2.6314-.4918.308-.9025.5467-1.1918.7092a19.142 19.142 0 0 1-.4301.2347l-.0248.013-.007.0036-.0021.0011c-.0003.0001-.0012.0006-.3438-.6666-.3426.6672-.3424.6673-.3426.6672l-.0033-.0017-.007-.0036-.0248-.013a19.142 19.142 0 0 1-.4301-.2347 29.324 29.324 0 0 1-1.1918-.7092c-.982-.6148-2.295-1.5104-3.6116-2.6314C2.8014 13.5735 0 10.3318 0 6.5135Z"
                      />
                    </svg>
                    <span>{totalResources || 'جديد'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured (أبرز الملفات المجانية) */}
        <section className="landing-section landing-hot" id="landing-hot" aria-labelledby="landing-hot-title">
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">الأحدث</p>
              <h2 id="landing-hot-title">أبرز الملفات المجانية</h2>
            </div>
            <Link href={PRODUCTS_ROUTE} className="landing-section-link">
              عرض كل الملفات
            </Link>
          </header>
          {loading ? (
            <div className="landing-skeleton-grid" aria-hidden>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`feature-skel-${index}`} className="landing-skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="landing-hot-grid">
              {featuredDisplay.map((item) => (
                <article key={item.id} className="landing-card">
                  <div className="landing-card-art">
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 48vw, 320px"
                      unoptimized={!shouldOptimizeImage(item.cover)}
                    />
                  </div>
                  <div className="landing-card-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.meta ? <span className="landing-card-meta">{item.meta}</span> : null}
                    <Link href={item.href ?? PRODUCTS_ROUTE} className="landing-card-action">
                      تحميل مجاني
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Quick start steps */}
        <section className="landing-started" aria-labelledby="landing-started-title">
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">خطوات سريعة</p>
              <h2 id="landing-started-title">ابدئي الرحلة بخطة واضحة</h2>
            </div>
            <p className="landing-section-note">
              نمشي معًا في مساحة آمنة توازن بين واقع الأم واحتياجات بيتها.
            </p>
          </header>
          <div className="landing-started-grid">
            {JOURNEY_STEPS.map((step) => (
              <article key={step.id} className="landing-started-card">
                <span className="landing-started-icon" aria-hidden>
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

        {/* FAQ */}
        <section className="landing-faq" aria-labelledby="landing-faq-title">
          <header className="landing-section-head">
            <div>
              <p className="landing-section-kicker">أسئلة شائعة</p>
              <h2 id="landing-faq-title">كل شيء عن المكتبة والرموز المجانية</h2>
            </div>
            <p className="landing-section-note">
              نجاوب عن أكثر الأسئلة التي تصلنا حول التحميل وإعادة الوصول للملفات والجلسة التعريفية.
            </p>
          </header>
          <Accordion items={FAQ_SNIPPET} defaultOpenIds={[FAQ_SNIPPET[0].id]} />
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-main">
            ملفات، جلسات، ومساحات دعم تذكّرك بأنك لست وحدك في رحلة الأمومة. كل ما نشاركه مجاني وجاهز للتنزيل الفوري.
          </div>
          <div className="landing-footer-nav">
            <div className="landing-footer-col">
              <h3>روابط سريعة</h3>
              <Link href="/">الرئيسية</Link>
              <Link href={PRODUCTS_ROUTE}>المكتبة</Link>
              <Link href={BOOKING_ROUTE}>جلسة تعريفية</Link>
              <Link href="/download">تنزيلاتي</Link>
            </div>
            <div className="landing-footer-col">
              <h3>تواصل</h3>
              {SOCIAL_LINKS.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  <span aria-hidden>{link.icon}</span> {link.label}
                </a>
              ))}
              <a href="mailto:meriembouzir05@gmail.com">meriembouzir05@gmail.com</a>
            </div>
            <div className="landing-footer-col">
              <h3>القانوني</h3>
              <Link href="/policy">الشروط والأحكام</Link>
              <Link href="/privacy">سياسة الخصوصية</Link>
              <a href="https://calendly.com/meriembouzir/free-call" target="_blank" rel="noopener noreferrer">
                الحجوزات عبر Calendly
              </a>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© {currentYear} Fittrah Moms</span>
            <span>كل الحقوق محفوظة لمريم بوزير</span>
          </div>
        </footer>
      </main>

      <ChatbotWidget />
    </>
  )
}
