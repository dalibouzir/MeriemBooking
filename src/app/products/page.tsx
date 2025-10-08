'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabaseClient } from '@/lib/supabase'
import CardProduct from '@/components/CardProduct'
import Tabs from '@/components/ui/Tabs'
import Accordion from '@/components/ui/Accordion'
import ChatbotWidget from '@/components/ChatbotWidget'
import {
  mapLibraryItems,
  mapLegacyProducts,
  type LibraryItemRow,
  type LegacyProductRow,
  type ProductResource,
} from '@/utils/products'

const BOOKING_URL = 'https://calendly.com/meriembouzir/30min'

const FAQ_ITEMS = [
  {
    id: 'download',
    title: 'كيف أستلم الملف بعد الدفع؟',
    content:
      'يتم فتح رابط تحميل مباشر بعد إتمام الدفع مباشرة، كما يصلك بريد إلكتروني يحتوي على الملف وملخص الخطوات. يمكن إعادة التحميل بأي وقت من صفحة التنزيلات.',
  },
  {
    id: 'gift',
    title: 'هل يشمل كل منتج رمز مكالمة استشارية؟',
    content:
      'نعم، بعد شراء أي كتاب أو فيديو يصلك رمز مكالمة مجانية يمكن استخدامه خلال ٣٠ يومًا لحجز جلسة مع مريم. بإمكانك إهداء الرمز لشخص آخر إذا رغبتِ.',
  },
  {
    id: 'refunds',
    title: 'هل يمكن استرجاع المبلغ؟',
    content:
      'يمكن طلب استرجاع خلال ٤٨ ساعة من الشراء إذا لم يتم فتح رابط التحميل. بعد تحميل الملف أو بدء مشاهدة الفيديو لا تتوفر إمكانية الاسترجاع، لكن يسعدنا مساعدتك في اختيار مورد آخر مناسب.',
  },
]

const HIGHLIGHTS = [
  {
    icon: '📘',
    title: 'كتب PDF مختصرة',
    description: 'خطط جاهزة بخطوات يومية، مع نماذج وجداول لتطبيق الأسرار داخل البيت فورًا.',
  },
  {
    icon: '🎥',
    title: 'جلسات فيديو تطبيقية',
    description: 'مشاهدات قصيرة مع تمارين عملية تساعدك على تعديل السلوك وتثبيت الروتين.',
  },
  {
    icon: '🎁',
    title: 'رموز جلسات مرافقة',
    description: 'كل عملية شراء تمنحك رمز Calendly لموعد تعريفي، يمكنك استخدامه أو إهداؤه لصديقة.',
  },
]

const STORE_PROMISES = [
  {
    title: 'تحميل فوري',
    detail: 'بمجرد إتمام الدفع يصلك الملف أو الفيديو فورًا مع بريد يحتوي على رابط دائم.',
  },
  {
    title: 'رمز جلسة مرافقة',
    detail: 'كل منتج يتضمن رمز Calendly صالحًا 30 يومًا لموعد تعريف مع مريم.',
  },
  {
    title: 'تحديثات مجانية',
    detail: 'إذا تم تحسين المحتوى لاحقًا يصلك إشعار لتحميل النسخة المحدّثة دون تكلفة.',
  },
]

export default function ProductsPage() {
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchProducts = async () => {
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

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [])

  const books = useMemo(() => resources.filter((item) => item.type === 'كتاب'), [resources])
  const videos = useMemo(() => resources.filter((item) => item.type === 'فيديو'), [resources])

  const tabs = useMemo(
    () => [
      {
        id: 'all',
        title: 'كل الموارد',
        content: <ProductGrid items={resources} emptyLabel="لم نضف موارد بعد." />,
      },
      {
        id: 'books',
        title: 'كتب PDF',
        content: <ProductGrid items={books} emptyLabel="قريبًا ستضاف كتب جديدة." />,
      },
      {
        id: 'videos',
        title: 'جلسات فيديو',
        content: <ProductGrid items={videos} emptyLabel="لا توجد فيديوهات حالياً." />,
      },
    ],
    [resources, books, videos],
  )

  return (
    <div className="storefront-page">
      <section className="storefront-hero">
        <motion.div
          className="storefront-hero-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        >
          <div className="storefront-hero-copy">
            <span className="storefront-tag">المتجر الرقمي</span>
            <h1>مكتبة فطرة الأمهات</h1>
            <p>
              كتب مختصرة، فيديوهات تطبيقية، وحزم من النماذج الجاهزة لتساعدك على ترتيب يوم العائلة وتهدئة البيت. كل ملف باللغة العربية، ويأتي مع رمز جلسة تعريفية عبر Calendly.
            </p>
            <div className="storefront-actions">
              <Link href="#catalog" className="btn btn-primary storefront-cta">ابدئي التسوق الآن</Link>
              <Link href={BOOKING_URL} className="btn storefront-secondary" target="_blank" rel="noopener noreferrer">
                جلسة شخصية مع مريم
              </Link>
            </div>
          </div>
          <div className="storefront-hero-gallery" aria-hidden>
            <div className="storefront-hero-card">
              <span className="storefront-hero-card-tag">كتاب PDF</span>
              <h3>روتين صباحي هادئ</h3>
              <p>خطة أسبوعية مع أوراق عمل للطباعة تساعدك على بدء اليوم بسلاسة.</p>
              <div className="storefront-hero-card-price">
                <span className="storefront-hero-card-number">35</span>
                <span className="storefront-hero-card-currency">د.ت</span>
              </div>
              <span className="storefront-hero-card-note">يشمل رمز جلسة مجانية</span>
            </div>
            <div className="storefront-hero-card storefront-hero-card--video">
              <span className="storefront-hero-card-tag">جلسة فيديو</span>
              <h3>تنظيم وقت الشاشة</h3>
              <p>درس تطبيقي قصير مع تمارين داخل البيت لتقليل التوتر حول الأجهزة.</p>
              <div className="storefront-hero-card-price storefront-hero-card-price--watch">
                <span>جاهز للمشاهدة</span>
              </div>
              <span className="storefront-hero-card-note">تحميل فوري + ملف متابعة</span>
            </div>
          </div>
          <ul className="storefront-promises">
            {STORE_PROMISES.map((item) => (
              <li key={item.title}>
                <span className="storefront-promise-title">{item.title}</span>
                <span className="storefront-promise-detail">{item.detail}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      <section className="storefront-highlights">
        {HIGHLIGHTS.map((highlight) => (
          <article key={highlight.title} className="storefront-highlight-card">
            <span className="storefront-highlight-icon" aria-hidden>
              {highlight.icon}
            </span>
            <h3>{highlight.title}</h3>
            <p>{highlight.description}</p>
          </article>
        ))}
      </section>

      <section id="catalog" className="storefront-catalog">
        <div className="storefront-catalog-head">
          <h2>تسوقي حسب ما تحتاجينه اليوم</h2>
          <p>قسّمنا المنتجات إلى تبويبات تساعدك على اختيار الملف المناسب، سواء كنتِ تفضلين القراءة أو التطبيق المرئي.</p>
        </div>

        {loading ? (
          <div className="home-product-skeletons" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="home-product-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="storefront-tabs">
            <Tabs tabs={tabs} defaultTabId="all" />
          </div>
        )}
      </section>

      <section className="storefront-faq">
        <div className="storefront-faq-head">
          <h2>أسئلة حول الدفع والتنزيل</h2>
          <p>كل التفاصيل التقنية والعملية مذكورة هنا. إن لم تجدي إجابة، تواصلي معنا مباشرة على واتساب أو البريد.</p>
        </div>
        <Accordion items={FAQ_ITEMS} defaultOpenIds={[FAQ_ITEMS[0].id]} />
      </section>

      <ChatbotWidget />
    </div>
  )
}

function ProductGrid({ items, emptyLabel }: { items: ProductResource[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="storefront-empty">{emptyLabel}</p>
  }
  return (
    <div className="storefront-grid">
      {items.map((item) => (
        <CardProduct
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          image={item.cover}
          type={item.type}
          format={item.format}
          duration={item.duration}
          rating={item.rating}
          reviewCount={item.reviews}
          price={item.price}
          badge={item.badge}
          primaryHref={item.downloadUrl ? item.downloadUrl : `/download?product=${item.slug}`}
          primaryLabel={item.type === 'فيديو' ? 'مشاهدة' : 'تحميل'}
          secondaryHref={`/download?product=${item.slug}`}
          secondaryLabel="التفاصيل"
        />
      ))}
    </div>
  )
}
