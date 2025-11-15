'use client'

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookmarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
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
    title: 'استلام الرابط والكود',
    detail: 'فور الضغط على تحميل تحصلين على رابط مباشر + رمز جلسة تعريفية يصل لبريدك.',
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
    description: 'إذا تعطل الرمز أو ضاع الرابط، فريق فطرة يرسله لك خلال دقائق.',
    icon: '💬',
  },
]

const FAQ_ITEMS = [
  {
    id: 'download',
    title: 'كيف أحمّل الملف بعد اختياره؟',
    content:
      'تظهر لك نافذة تحتوي على الرابط المباشر والرمز المجاني فور الضغط على زر التحميل، ويصل الرابط نفسه إلى بريدك خلال دقائق للحفظ.',
  },
  {
    id: 'codes',
    title: 'ما فائدة رمز الجلسة؟',
    content:
      'كل تحميل يمنحك رمز جلسة تعريفية مجانية مع مريم بوزير. الرمز صالح مرة واحدة ويمكنك إهداؤه لصديقة تحتاج للدعم.',
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
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<BookCategory>('الكل')
  const [selectedBook, setSelectedBook] = useState<ShelfBook | null>(null)

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

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (selectedBook) document.body.classList.add('sheet-open')
    else document.body.classList.remove('sheet-open')
    return () => document.body.classList.remove('sheet-open')
  }, [selectedBook])

  const normalizedResources = useMemo(() => resources.map(normalizeResource), [resources])

  const filteredBooks = useMemo(() => {
    if (activeCategory === 'الكل') return normalizedResources
    return normalizedResources.filter((book) => book.tags.includes(activeCategory))
  }, [activeCategory, normalizedResources])

  const handleCardSelect = (book: ShelfBook) => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 900px)').matches) {
      setSelectedBook(book)
    }
  }

  const handleCloseSheet = () => setSelectedBook(null)

  return (
    <main className="library-page" dir="rtl">
      <section aria-labelledby="library-shelf-title">
        <div className="library-section-head">
          <div>
            <p className="library-hero-subtitle">مكتبة فطرة</p>
            <h2 id="library-shelf-title">رف رقمي لكل الأدلة والملفات</h2>
            <p>تصفّحي التصنيفات بسرعة أو اسحبي الشريط الجانبي لاختيار ما يناسب رحلتك أو عمر طفلك.</p>
          </div>
          <Link href={CTA_ROUTE} className="library-section-cta">
            شاهدي جميع الملفات
          </Link>
        </div>

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
              <div className="library-grid" role="list">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} onSelect={handleCardSelect} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section id="library-workflow" className="library-flow" aria-labelledby="library-flow-title">
        <div className="library-section-head">
          <div>
            <h2 id="library-flow-title">كيف تعمل التنزيلات؟</h2>
            <p>ثلاث خطوات متتالية تنتهي بملف مطبوع وجلسة تعريفية مجانية.</p>
          </div>
        </div>
        <div className="library-flow-steps">
          {FLOW_STEPS.map((step, index) => (
            <article key={step.id} className="library-flow-step">
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

      <section aria-labelledby="library-why-title">
        <div className="library-section-head">
          <div>
            <h2 id="library-why-title">لماذا سميناها مكتبة؟</h2>
            <p>لأنها ليست مجرد صفحة منتج واحد، بل رفوف متجددة لأدلة ودورات مصغرة.</p>
          </div>
        </div>
        <div className="library-why">
          {WHY_POINTS.map((card) => (
            <article key={card.id} className="library-why-card">
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
        <div className="library-section-head">
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

      <AnimatePresence>
        {selectedBook ? (
          <motion.div
            className="library-sheet-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseSheet}
          >
            <motion.div
              className="library-sheet-panel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="library-sheet-header">
                <div>
                  <h3 className="library-card-title">{selectedBook.title}</h3>
                  <p className="library-card-desc">{selectedBook.description}</p>
                </div>
                <button type="button" className="library-sheet-close" onClick={handleCloseSheet} aria-label="إغلاق">
                  <XMarkIcon className="library-menu-icon" aria-hidden />
                </button>
              </div>

              <div className="library-sheet-cover">
                <Image
                  src={selectedBook.cover}
                  alt="غلاف الملف المختار"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                />
                {selectedBook.badge ? <span className="library-card-badge">{selectedBook.badge}</span> : null}
              </div>

              <ul className="library-sheet-benefits">
                {selectedBook.benefits.map((benefit, index) => (
                  <li key={`${selectedBook.id}-sheet-${index}`}>{benefit}</li>
                ))}
              </ul>

              <div className="library-sheet-actions">
                <SmartLink href={selectedBook.ctaHref} className="primary">
                  تحميل PDF / فتح الملف
                </SmartLink>
                <Link href={CTA_ROUTE} className="secondary">
                  إضافة إلى المفضلة
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
type SmartLinkProps = {
  href: string
  className?: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

function SmartLink({ href, className = '', children, onClick }: SmartLinkProps) {
  const external = /^https?:\/\//i.test(href)
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

type BookCardProps = {
  book: ShelfBook
  onSelect: (book: ShelfBook) => void
}

function BookCard({ book, onSelect }: BookCardProps) {
  const handleCoverClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
  }

  const downloadButton = (
    <SmartLink href={book.ctaHref} className="library-card-btn" onClick={(event) => event.stopPropagation()}>
      <ArrowDownTrayIcon className="library-menu-icon" aria-hidden />
      <span>{book.ctaLabel}</span>
    </SmartLink>
  )

  return (
    <article className="library-card" role="listitem" onClick={() => onSelect(book)}>
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
        <button
          type="button"
          className="library-card-bookmark"
          aria-label="إضافة إلى المفضلة"
          onClick={(event) => event.stopPropagation()}
        >
          <BookmarkIcon className="library-menu-icon" aria-hidden />
        </button>
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
  const ctaHref = resource.downloadUrl
    ? resource.downloadUrl
    : resource.slug
      ? `/download?product=${resource.slug}`
      : `/download?product=${resource.id}`
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
  benefits.push('يشمل رمز تنزيل مجاني + جلسة تعريفية')
  return benefits.slice(0, 3)
}
