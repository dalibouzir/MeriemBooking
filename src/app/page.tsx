'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Accordion from '@/components/ui/Accordion'
import { supabaseClient } from '@/lib/supabase'
import {
  mapLibraryItems,
  mapLegacyProducts,
  type LibraryItemRow,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'

const BOOKING_ROUTE = '/redeem'
const PRODUCTS_ROUTE = '/products'
const HERO_IMAGE = '/Meriem.png'

const CTA_ITEMS = [
  'حمّلي ملفًا مجانيًا لتحصلي على رمز المكالمة الأولى',
  'ملفات رقمية مجانية لكل مرحلة من الأمومة',
  'مجتمع حيّ يشارك انتصاراته الصغيرة يوميًا',
]

const SESSION_FAQ_ITEMS = [
  {
    id: 'session-details',
    title: 'ما تفاصيل جلسة الإرشاد نحو الاتزان؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-card-single">
          <p>
            جلسة فردية للإرشاد نحو الاتزان، هادئة وعميقة مدّتها ساعة كاملة. أهيئ لك خلالها مساحة آمنة لتفهمي مشاعرك،
            وتستعيدي توازنك الداخلي بخطوات واضحة ومدروسة ترافق يومك بعد المكالمة.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'session-fit',
    title: 'لمن تناسب هذه الجلسة؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card">
          <ul className="landing-session-list">
            <li>
              <strong>يعاني من مشكلات في العلاقات تؤثّر على استقراره وحياته اليومية</strong>
              <span>(علاقات مرهِقة، صعوبات زوجية، توتر عائلي…)</span>
            </li>
            <li>
              <strong>يمرّ بحالة تعب مستمر أو ضغط داخلي، فقد طاقته أو إحساسه بذاته</strong>
              <span>أو يحمل مشاعر مربكة لا يعرف كيف يتعامل معها.</span>
            </li>
            <li>
              <strong>لديه مرض مزمن أو مشكلة عضوية ويرغب في فهم جذورها الشعورية بعمق</strong>
              <span>(الجلسة لا تعوّض الطبيب ولا تتعارض مع العلاج الطبي.)</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'session-process',
    title: 'ماذا نفعل داخل الجلسة؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card">
          <p className="landing-session-label">ماذا نفعل داخل الجلسة؟</p>
          <ul className="landing-session-list">
            <li>
              <strong>استخراج الكود العاطفي للمشكلة الأساسية</strong>
              <span>من خلال أسئلة دقيقة تساعدني على تحليل مشاعرك والوصول إلى الجذر الحقيقي للمشكلة.</span>
            </li>
            <li>
              <strong>تحويل الكود المضطرب إلى كود متزن</strong>
              <span>ثم أقدّم لك إرشادات عملية وواضحة تساعدك على استعادة الاتزان والتعامل مع المشكلة بوعي وطمأنينة.</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'session-note',
    title: 'ملاحظة مهمة عن الجلسات',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-note-card" role="note">
          <p className="landing-session-label">ملاحظة مهمة</p>
          <p>
            تُجرى الجلسة في إطار من السرّية التامة واحترام الخصوصية، وفي أجواء خالية من الأحكام واللوم ومن أي شكل من
            أشكال جلد الذات.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'session-booking',
    title: 'كيف أحجز جلسة الإرشاد؟',
    content: (
      <div className="landing-session-faq">
        <div className="landing-session-card landing-session-cta">
          <div>
            <p className="landing-session-label">الحجز</p>
            <p className="landing-session-cta-copy">جلسات سرّية، فردية، ومخصّصة لك تمامًا.</p>
          </div>
          <Link href={BOOKING_ROUTE} className="landing-btn landing-btn-primary">
            احجزي جلستك
          </Link>
        </div>
      </div>
    ),
  },
]

const FAQ_SNIPPET = [
  ...SESSION_FAQ_ITEMS,
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
      'المجانية مخصّصة لتقييم الوضع الحالي وتقديم خطة أولية. الجلسة المدفوعة أعمق وتشمل متابعة أسبوعية وملفًا ملخّصًا بالتوصيات.',
  },
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
  { href: 'https://wa.me/33665286368', label: 'واتساب (+33 6 65 28 63 68)', icon: '💬' },
]

type LandingDisplay = {
  id: string
  title: string
  description: string
  summary?: string
  cover: string
  meta?: string
  href?: string
  badge?: string
  format?: string
  duration?: string
  typeLabel?: string
  reviews?: number
  dateLabel?: string
}

// const FALLBACK_SHOWCASE: LandingDisplay = {
//   id: 'showcase-fallback',
//   title: 'ملف العودة للسكينة',
//   description: 'ملف عملي يعيد ترتيب يوم الأم ويمنحك خطوات صغيرة تخلق سلامًا داخل البيت.',
//   summary: 'خطّة مختصرة تساعدك على تهدئة فوضى اليوم وإعادة وصل العائلة بالطمأنينة.',
//   cover:
//     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4peUdkcJz7xez1x9Gw-6Hnnlturg2SNLHVg&s',
//   meta: 'كتاب PDF · 12 صفحة',
//   href: PRODUCTS_ROUTE,
//   badge: 'مفضل',
//   format: 'كتاب PDF',
//   duration: '12 صفحة عملية',
//   typeLabel: 'كتاب',
//   reviews: 184,
//   dateLabel: 'ربيع 2024',
// }

const FALLBACK_FEATURES: LandingDisplay[] = [
  {
    id: 'feature-1',
    title: 'دليلك لتستعيدي هدوءك وتوازنك كأمّ',
    description:
      'ربيع الأول 1447 هـ\n\n' +
      'يضع هذا الكتيّب بين يديك استراتيجيات عملية تمكّنك من:\n' +
      '- إدارة مشاعرك بوعي وهدوء\n' +
      '- استعادة أنوثتك واتصالك بذاتك الحقيقية\n' +
      '- رسم حدود واضحة تحافظ على طاقتك وعلاقاتك الصحية',
    summary:
      'يضع هذا الكتيّب بين يديك استراتيجيات عملية تمكّنك من:\n' +
      '- إدارة مشاعرك بوعي وهدوء\n' +
      '- استعادة أنوثتك واتصالك بذاتك الحقيقية\n' +
      '- رسم حدود واضحة تحافظ على طاقتك وعلاقاتك الصحية',
    cover:
      'https://i.ibb.co/RhpnYWV/Enis-cyberpunk-ottoman-sultan-in-a-cyberpunk-city-8-K-hyperreali-e7506c88-2574-487c-838e-5bb8618dd1c.png',
    meta: 'كتاب PDF · 10 صفحات مركّزة',
    href: PRODUCTS_ROUTE,
    badge: 'مفضل',
    format: 'كتاب PDF',
    duration: '10 صفحات مركّزة',
    typeLabel: 'كتاب',
    reviews: 162,
    dateLabel: '19 سبتمبر 2025',
  },
  {
    id: 'feature-2',
    title: 'حوار أم وابنتها',
    description: 'نموذج عملي يساعدك على فتح مساحة حديث آمنة داخل البيت مع ابنتك.',
    summary: 'سلسلة أسئلة خفيفة تفتح الطريق لحوار دافئ وخالٍ من الأحكام بين الأم وابنتها.',
    cover:
      'https://i.ibb.co/SrNRC0b/Erkan-Erdil-angry-soviet-officer-shouting-his-soldiers8k-octane-7b802966-9d4e-4c6e-ac37-d4f751419081.png',
    meta: 'جلسة تطبيقية',
    href: PRODUCTS_ROUTE,
    badge: 'جلسة مباشرة',
    format: 'جلسة تطبيقية',
    duration: '45 دقيقة',
    typeLabel: 'جلسة',
    reviews: 94,
    dateLabel: 'خريف 2023',
  },
  {
    id: 'feature-3',
    title: 'إعادة وصل الزوجين',
    description: 'خطوات عملية قصيرة تساعد على الحفاظ على وئام العلاقة وسط الضغوط اليومية.',
    summary: 'محفّز عملي يساعدكما على إعادة ضبط النوايا وفتح مساحة ودّ متجددة بين الزوجين.',
    cover:
      'https://i.ibb.co/YjzSzjk/Erkan-Erdil-very-technical-and-detailed-blueprint-of-wolf-carve-bd937607-6a4f-4525-b4f2-b78207e64662.png',
    meta: 'كتاب PDF',
    href: PRODUCTS_ROUTE,
    badge: 'الأكثر طلبًا',
    format: 'كتاب PDF',
    duration: '18 صفحة إرشادية',
    typeLabel: 'كتاب',
    reviews: 203,
    dateLabel: 'صيف 2023',
  },
  {
    id: 'feature-4',
    title: 'جلسة تهدئة مسائية',
    description: 'تأمّل صوتي يساعدك على تهدئة التوتر قبل النوم والنزول تدريجيًا من ضجيج اليوم إلى سكينة الليل.',
    summary: 'مرافقة صوتية لطيفة تُهيئ جسدك وعقلك لنوم أعمق وأكثر طمأنينة.',
    cover:
      'https://i.ibb.co/VLfJ41h/MR-ROBOT-two-cyberpunk-cowboys-dueling-6ae4203d-3539-4033-a9d9-80d747ac6498.png',
    meta: 'جلسة صوتية',
    href: PRODUCTS_ROUTE,
    badge: 'تأمل صوتي',
    format: 'صوتيات',
    duration: '12 دقيقة',
    typeLabel: 'جلسة',
    reviews: 118,
    dateLabel: 'ربيع 2023',
  },
]

function mapResourceToDisplay(resource: ProductResource): LandingDisplay {
  const dateLabel = resource.createdAt
    ? new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(resource.createdAt))
    : undefined

  return {
    id: resource.id,
    title: resource.title,
    description: resource.snippet || resource.description,
    summary: resource.snippet || resource.description,
    cover: resource.cover,
    meta: resource.format
      ? `${resource.format}${resource.duration ? ` · ${resource.duration}` : ''}`
      : resource.duration || resource.type,
    href: resource.slug ? `/download?product=${resource.slug}` : `/download?product=${resource.id}`,
    badge: resource.badge,
    format: resource.format,
    duration: resource.duration,
    typeLabel: resource.type,
    reviews: resource.reviews,
    dateLabel,
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

  const featuredItems = useMemo(() => resources.slice(0, 4), [resources])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

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
            <div className="landing-hero-identity">
              <span className="landing-hero-kicker">
                مساحتك للسكينة والأنوثة والاتزان العاطفي Fittrah Moms
              </span>
            </div>
            <div className="landing-hero-display">
              <div className="landing-hero-art">
                <Image
                  src={HERO_IMAGE}
                  alt="مريم بوزير"
                  fill
                  sizes="(max-width: 768px) 80vw, (max-width: 1280px) 420px, 520px"
                  className="landing-hero-image"
                  priority
                  unoptimized={!shouldOptimizeImage(HERO_IMAGE)}
                />
              </div>
            </div>
            <div className="landing-hero-info">
              <div className="landing-hero-intro" aria-label="مقدمة Fittrah Moms">
                <h1 id="landing-hero-title" className="landing-hero-headline" dir="rtl">
منصّة تُساعد المرأة على استعادة أنوثتها وفطرتها لتعيش علاقاتٍ صحّية، وبيتًا أهدأ، ومجتمعًا أكثر اتّزانًا؛ فحين تتّزن المرأة ينعكس نورها على أسرتها، ويمتدّ أثرها إلى الجيل القادم كلّه.</h1>
              </div>
              <div className="landing-hero-actions">
                <button type="button" className="landing-btn landing-btn-primary" onClick={handleScrollToFeatured}>
                  استكشفي الملفات
                </button>
                <Link href={BOOKING_ROUTE} className="landing-btn landing-btn-secondary">
                  استبدلي رمز المكالمة
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-bio" aria-labelledby="landing-bio-title">
          <div className="landing-bio-card">
            <div className="landing-bio-figure">
              <Image src="/Meriem.jpeg" alt="مريم بوزير" width={176} height={176} className="landing-bio-avatar" />
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
            <>
              {error ? (
                <p className="landing-hot-error" role="status">
                  {error}
                </p>
              ) : null}
              <div className="landing-files-grid" role="list">
                {featuredDisplay.map((item) => (
                  <article key={item.id} className="landing-file-card" role="listitem" tabIndex={0}>
                    <div className="landing-file-media">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 88vw, (max-width: 1280px) 360px, 420px"
                        unoptimized={!shouldOptimizeImage(item.cover)}
                      />
                    </div>
                    <div className="landing-file-panel">
                      <div className="landing-file-panel-inner">
                        <div className="landing-file-panel-head">
                          <p className="landing-file-panel-title">{item.title}</p>
                          {(item.dateLabel || item.meta) && (
                            <div className="landing-file-panel-meta">
                              {item.dateLabel && <span>{item.dateLabel}</span>}
                              {item.meta && <span>{item.meta}</span>}
                            </div>
                          )}
                        </div>
                        <div className="landing-file-panel-section">
                          <p className="landing-file-panel-label">الوصف</p>
                          <p className="landing-file-panel-text">{item.description}</p>
                        </div>
                        <div className="landing-file-panel-section">
                          <p className="landing-file-panel-label">لمحة</p>
                          <p className="landing-file-panel-text">{item.summary ?? item.description}</p>
                        </div>
                        <div className="landing-file-panel-cta">
                          <Link href={PRODUCTS_ROUTE} className="landing-file-panel-btn">
                            استكشفي الملفات
                          </Link>
                          <Link href={BOOKING_ROUTE} className="landing-file-panel-btn landing-file-panel-btn-secondary">
                            استبدلي رمز المكالمة
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="landing-cta" aria-labelledby="landing-cta-title">
          <div className="landing-cta-body">
            <div className="landing-cta-copy">
              <h2 id="landing-cta-title">ابدئي بخطوة صغيرة تُحدِث أثرًا كبيرًا</h2>
              <p>حمّلي ملفًا مجانيًا، احصلي على رمز المكالمة، ثم استبدليه لاختيار موعدك مع مريم بوزير في مساحة تسمعك بصدق.</p>
            </div>
            <ul className="landing-cta-list">
              {CTA_ITEMS.map((item, index) => (
                <li key={`cta-item-${index}`}>
                  <span aria-hidden className="landing-cta-dot" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="landing-cta-actions">
              <Link href={BOOKING_ROUTE} className="landing-btn landing-btn-primary">
                استبدلي رمز المكالمة
              </Link>
              <Link href={PRODUCTS_ROUTE} className="landing-btn landing-btn-secondary">
                تصفّحي المكتبة الآن
              </Link>
              <Link href="/train-program" className="landing-btn landing-btn-ghost">
                بـرنـامـج تـدريـبـي
              </Link>
            </div>
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
          <div className="landing-footer-grid">
            <div className="landing-footer-main">
              ملفات، جلسات، ومساحات دعم تذكّرك بأنك لست وحدك في رحلة الأمومة. كل ما نشاركه مجاني وجاهز للتنزيل الفوري.
            </div>
            <div className="landing-footer-nav">
              <div className="landing-footer-col">
                <h3>روابط سريعة</h3>
                <Link href="/">الرئيسية</Link>
                <Link href={PRODUCTS_ROUTE}>المكتبة</Link>
                <Link href={BOOKING_ROUTE}>استبدال رمز المكالمة</Link>
                <Link href="/train-program">بـرنـامـج تـدريـبـي</Link>
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
                <h3>الحجوزات</h3>
                <Link href={BOOKING_ROUTE}>استبدال رمز المكالمة</Link>
                <Link href={PRODUCTS_ROUTE}>الحصول على رمز جديد</Link>
              </div>
              <div className="landing-footer-col">
                <h3>القانوني</h3>
                <Link href="/policy">الشروط والأحكام</Link>
                <Link href="/privacy">سياسة الخصوصية</Link>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© {currentYear} Fittrah Moms</span>
            <span>كل الحقوق محفوظة لمريم بوزير</span>
          </div>
        </footer>
      </main>
    </>
  )
}
