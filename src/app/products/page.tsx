'use client'

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookmarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import Accordion from '@/components/ui/Accordion'
import ChatbotWidget from '@/components/ChatbotWidget'
import { supabaseClient } from '@/lib/supabase'
import {
  mapLegacyProducts,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'

const CATEGORY_TABS = ['الكل', 'كتب', 'جلسات فيديو'] as const

type BookCategory = (typeof CATEGORY_TABS)[number]

type ShelfBook = {
  id: string
  title: string
  description: string
  cover: string
  format: string
  duration: string
  type: ProductResource['type']
  tags: BookCategory[]
  audience: string
  badge?: string
  snippet?: string
  benefits: string[]
  ctaHref: string
  ctaLabel: string
}

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

const WHY_POINTS = [
  {
    id: 'curation',
    title: 'انتقاء بعناية',
    description: 'كل ملف مبني على جلسات واقعية مع أمهات فطرة لضمان التطبيق السهل.',
    icon: '📚',
  },
  {
    id: 'arabic',
    title: 'تجربة عربية حديثة',
    description: 'تصميم يمزج التدرجات الهادئة مع خطوط عربية واضحة تجعل التصفح مريحًا.',
    icon: '🎨',
  },
  {
    id: 'future',
    title: 'مكتبة تتوسع',
    description: 'نضيف أوراق عمل ودورات قصيرة بشكل دوري مع إشعارات فور توفرها.',
    icon: '🚀',
  },
  {
    id: 'support',
    title: 'دعم فوري',
    description: 'إذا تعطل الرابط أو واجهت مشكلة في الوصول، فريق فطرة يرسله لك خلال دقائق.',
    icon: '💬',
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
const CLICK_ID_KEY = 'fm_click_id'

function getOrCreateClickId() {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.sessionStorage.getItem(CLICK_ID_KEY)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)
    window.sessionStorage.setItem(CLICK_ID_KEY, id)
    return id
  } catch {
    return ''
  }
}

function trackDownloadClick(product: string, source: string) {
  if (typeof window === 'undefined') return
  const clickId = getOrCreateClickId()
  if (!clickId) return
  const payload = {
    clickId,
    product,
    source,
    referrer: document?.referrer || '',
    event: 'click' as const,
  }
  const body = JSON.stringify(payload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics/download-click', new Blob([body], { type: 'application/json' }))
  } else {
    fetch('/api/metrics/download-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }
}

export default function ProductsPage() {
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<BookCategory>('الكل')
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const gridRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let cancelled = false
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        const rows = (Array.isArray(data) ? data : []) as LegacyProductRow[]
        const mapped = mapLegacyProducts(rows)
        if (!cancelled) setResources(mapped)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('حدث خلل غير متوقع. أعيدي تحميل الصفحة أو تواصلي مع الدعم.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [])

  const normalizedResources = useMemo(() => resources.map(normalizeResource), [resources])

  const filteredBooks = useMemo(() => {
    if (activeCategory === 'الكل') return normalizedResources
    return normalizedResources.filter((book) => book.tags.includes(activeCategory))
  }, [activeCategory, normalizedResources])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.library-page .appear-on-scroll')
    )
    if (!elements.length) return

    const revealAll = () => elements.forEach((el) => el.classList.add('is-visible'))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [filteredBooks.length, activeCategory])

  useEffect(() => {
    setActiveCardIndex(0)
    const container = gridRef.current
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeCategory, filteredBooks.length])

  useEffect(() => {
    const container = gridRef.current
    if (!container) return

    const updateActiveCard = () => {
      const items = Array.from(container.children) as HTMLElement[]
      if (!items.length) return
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.left + containerRect.width / 2
      let nextIndex = 0
      let smallestDelta = Number.POSITIVE_INFINITY

      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect()
        const itemCenter = itemRect.left + itemRect.width / 2
        const delta = Math.abs(itemCenter - containerCenter)
        if (delta < smallestDelta) {
          smallestDelta = delta
          nextIndex = index
        }
      })

      setActiveCardIndex(nextIndex)
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        updateActiveCard()
        frame = 0
      })
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    updateActiveCard()

    return () => {
      container.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [filteredBooks.length])

  const scrollToCard = (index: number) => {
    const container = gridRef.current
    if (!container) return
    const target = container.children[index] as HTMLElement | undefined
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setActiveCardIndex(index)
  }

  return (
    <main className="library-page" dir="rtl">
      <section aria-labelledby="library-shelf-title">
        <h1 id="library-shelf-title" className="library-hero-title">
          مكتبة فطرة
        </h1>

        <nav className="library-filter-tabs" aria-label="تصنيفات المكتبة">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`library-filter-tab${tab === activeCategory ? ' is-active' : ''}`}
              onClick={() => setActiveCategory(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <p className="library-grid-hint">اسحبي لرؤية المزيد من الملفات على الهاتف.</p>

        {error ? (
          <div className="library-error" role="alert">
            {error}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="library-status-bar" role="status">
                <span className="library-status-pill">
                  <ClockIcon className="library-menu-icon" aria-hidden />
                  يتم تحديث المكتبة الآن
                </span>
                <span>نجلب أحدث الملفات من مريم بوزير.</span>
              </div>
            ) : null}
            {!filteredBooks.length && !loading ? (
              <p className="library-empty">
                لم نضف أي ملفات بعد. أرفعي الكتب إلى جدول Supabase
                {' '}
                <span className="ltr-text">products</span>
                {' '}
                لتظهر هنا فورًا.
              </p>
            ) : (
              <>
                <div className="library-grid appear-on-scroll" role="list" ref={gridRef} style={{ '--delay': '0.08s' } as CSSProperties}>
                  {filteredBooks.map((book, index) => (
                    <BookCard key={book.id} book={book} index={index} />
                  ))}
                </div>
                {filteredBooks.length > 1 ? (
                  <div className="library-grid-dots appear-on-scroll" aria-label="تصفح المكتبة" style={{ '--delay': '0.12s' } as CSSProperties}>
                    {filteredBooks.map((book, index) => (
                      <button
                        key={book.id}
                        type="button"
                        className={`library-grid-dot${index === activeCardIndex ? ' is-active' : ''}`}
                        aria-label={`الانتقال إلى ${book.title}`}
                        aria-pressed={index === activeCardIndex}
                        onClick={() => scrollToCard(index)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
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

      <section aria-labelledby="library-why-title" className="library-why-area">
        <div className="library-section-head appear-on-scroll" style={{ '--delay': '0.18s' } as CSSProperties}>
          <div>
            <h2 id="library-why-title">لماذا سميناها مكتبة؟</h2>
            <p>لأنها ليست مجرد صفحة منتج واحد، بل رفوف متجددة لأدلة ودورات مصغرة.</p>
          </div>
        </div>
        <div className="library-why">
          {WHY_POINTS.map((card) => (
            <article
              key={card.id}
              className="library-why-card appear-on-scroll"
              style={{ '--delay': '0.22s' } as CSSProperties}
            >
              <span className="library-why-icon" aria-hidden>
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
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
type SmartLinkProps = {
  href: string
  className?: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  trackProductId?: string
}

function SmartLink({ href, className = '', children, onClick, trackProductId }: SmartLinkProps) {
  const external = /^https?:\/\//i.test(href)
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (trackProductId && href.startsWith('/download')) {
      trackDownloadClick(trackProductId, 'products-page')
    }
    onClick?.(event)
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}

type BookCardProps = {
  book: ShelfBook
  index: number
}

function BookCard({ book, index }: BookCardProps) {
  const handleCoverClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
  }

  const downloadButton = (
    <SmartLink
      href={book.ctaHref}
      className="library-card-btn"
      onClick={(event) => event.stopPropagation()}
      trackProductId={book.id}
    >
      <ArrowDownTrayIcon className="library-menu-icon" aria-hidden />
      <span>{book.ctaLabel}</span>
    </SmartLink>
  )

  return (
    <article
      className="library-card appear-on-scroll"
      role="listitem"
      style={{ '--delay': `${index * 80}ms` } as CSSProperties}
    >
      <SmartLink href={book.ctaHref} className="library-card-cover-link" onClick={handleCoverClick}>
        <div className="library-card-cover">
          <Image src={book.cover} alt={book.title} fill sizes="(max-width: 680px) 80vw, 300px" />
        </div>
      </SmartLink>
      <h3 className="library-card-title">{book.title}</h3>
      <p className="library-card-desc">{book.description}</p>
      <div className="library-card-meta">
        <span className="library-card-meta-item">
          <DocumentTextIcon aria-hidden />
          {book.format}
        </span>
        <span className="library-card-meta-item">
          <UserGroupIcon aria-hidden />
          {book.audience}
        </span>
        <span className="library-card-meta-item">
          <ClockIcon aria-hidden />
          {book.duration}
        </span>
      </div>
      <div className="library-card-actions">
        {downloadButton}
      </div>
    </article>
  )
}

function normalizeResource(resource: ProductResource): ShelfBook {
  const safeDescription = resource.description?.trim() || 'ملف عملي يحتوي على خطوات بسيطة قابلة للطباعة.'
  const safeResource = { ...resource, description: safeDescription }
  const isBook = resource.type !== 'فيديو'
  const cover = resource.cover || '/Meriem.png'
  const format = resource.format || (isBook ? 'كتاب PDF' : 'جلسة تطبيقية')
  const duration = resource.duration || (isBook ? '12 صفحة' : '20 دقيقة')
  const tags = deriveTags(isBook)
  const benefits = buildBenefits(safeResource)
  const downloadQueryBase = resource.slug ? `/download?product=${resource.slug}` : `/download?product=${resource.id}`
  const snippetParam = resource.snippet ? `&snippet=${encodeURIComponent(resource.snippet)}` : ''
  const ctaHref = resource.downloadUrl ? resource.downloadUrl : `${downloadQueryBase}${snippetParam}`
  const audience = isBook ? 'كتاب' : 'جلسة فيديو'
  const ctaLabel = isBook ? 'تحميل فوري' : 'تشغيل الآن'

  return {
    id: resource.id,
    title: resource.title,
    description: safeDescription,
    cover,
    format,
    duration,
    type: resource.type,
    tags,
    audience,
    badge: resource.badge,
    snippet: resource.snippet,
    benefits,
    ctaHref,
    ctaLabel,
  }
}

function deriveTags(isBook: boolean): BookCategory[] {
  const tags = new Set<BookCategory>()
  tags.add('الكل')
  if (isBook) tags.add('كتب')
  else tags.add('جلسات فيديو')
  return Array.from(tags)
}

function buildBenefits(resource: ProductResource): string[] {
  const base = resource.snippet || resource.description
  const benefits: string[] = []
  if (base) benefits.push(base.length > 90 ? `${base.slice(0, 90)}…` : base)
  benefits.push(resource.type === 'كتاب' ? 'ملفات قابلة للطباعة فورًا' : 'جلسة تطبيقية يمكن تشغيلها في أي وقت')
  benefits.push('يشمل جلسة تعريفية مجانية للتطبيق')
  return benefits.slice(0, 3)
}
