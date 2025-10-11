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

const FREE_CALL_ROUTE = '/free-call'

const DOWNLOAD_FLOW = [
  {
    id: 'choose',
    title: 'اختاري الملف المجاني',
    detail: 'تصفحي مكتبة مريم الرقمية واختر الكتب أو الدلائل العملية التي تحتاجينها الآن. جميع المواد متاحة بدون أي تكلفة.',
  },
  {
    id: 'unlock',
    title: 'احصلي على الرمز والرابط',
    detail: 'بعد الضغط على تحميل يظهر لك الرمز الخاص بك ويصلك بريد إلكتروني يحتوي على رابط التنزيل المباشر ورصيدك من الأكواد.',
  },
  {
    id: 'call',
    title: 'جلسة مجانية لمرة واحدة',
    detail: 'يمكن استخدام الرمز لحجز جلسة تعريفية مجانية مع مريم. الرمز صالح لمرة واحدة ويمكنك إهداؤه إذا رغبتِ.',
  },
]

const CLARIFICATION_CARDS = [
  {
    id: 'links',
    title: 'روابط تنزيل ثابتة',
    description:
      'سيبقى رابط التحميل متاحًا داخل صندوق بريدك وداخل صفحة التنزيلات في الحساب، ولا ننهي صلاحيته حتى مع تحديث النسخة.',
  },
  {
    id: 'upcoming',
    title: 'مكتبة تتوسع باستمرار',
    description:
      'نضيف أدلة جديدة، جلسات تطبيقية، وملفات جاهزة للطباعة تدريجيًا. كل ما يُنشر في المستقبل سيبقى مجانًا.',
  },
  {
    id: 'support',
    title: 'دعم فني سريع',
    description:
      'إذا لم يصلك البريد أو احتجتِ إعادة إرسال الرابط، تواصلي معنا عبر الدردشة وسنرسل لك الملف خلال دقائق.',
  },
]

const FAQ_ITEMS = [
  {
    id: 'download-flow',
    title: 'كيف يصلني رابط التحميل؟',
    content:
      'بمجرد الضغط على زر التحميل يظهر لك كود خاص مع رابط التنزيل الفوري. خلال دقائق يصلك أيضًا بريد إلكتروني يحتوي على نفس الرابط للاحتفاظ به.',
  },
  {
    id: 'code-usage',
    title: 'ما فائدة الكود الذي أستلمه؟',
    content:
      'الكود يمنحك جلسة تعريفية مجانية مع مريم يمكن استخدامها مرة واحدة فقط. عندما تحجزين الموعد عبر Calendly أدخلي الكود لإتمام الحجز دون دفع.',
  },
  {
    id: 'future',
    title: 'هل ستبقى المواد مجانية مستقبلًا؟',
    content:
      'نعم. نعمل على تحويل كل مكتبة فطرة إلى مصادر مجانية قابلة للتنزيل، مع تحديثات مستمرة وإشعارات عند إضافة ملفات جديدة.',
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
        title: 'كل الملفات',
        content: <ProductGrid items={resources} emptyLabel="قريبًا ستظهر ملفات مكتبة مريم كاملة." />,
      },
      {
        id: 'books',
        title: 'كتب PDF',
        content: <ProductGrid items={books} emptyLabel="نجهز دفعة جديدة من الكتب المجانية." />,
      },
      {
        id: 'videos',
        title: 'جلسات تطبيقية',
        content: <ProductGrid items={videos} emptyLabel="لا توجد جلسات فيديو حتى الآن." />,
      },
    ],
    [resources, books, videos],
  )

  return (
    <div className="maktba-page">
      <motion.section
        id="maktba"
        className="maktba-catalog"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
      >
        <header className="maktba-heading">
          <span className="maktba-kicker">مكتبة</span>
          <h1>مكتبة مريم الرقمية</h1>
          <p>كل الكتب والجلسات هنا مجانية للتنزيل الفوري.</p>
        </header>

        {loading ? (
          <div className="maktba-skeletons" aria-hidden>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="maktba-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <Tabs tabs={tabs} defaultTabId="all" className="maktba-tabs" />
        )}
      </motion.section>

      <section className="maktba-flow">
        <div className="maktba-section-head">
          <h2>كيف يعمل التنزيل؟</h2>
          <p>ثلاث خطوات سريعة تحفظ لك الملفات والرموز دون أي إجراءات دفع.</p>
        </div>
        <div className="maktba-flow-grid">
          {DOWNLOAD_FLOW.map((step, index) => (
            <article key={step.id} className="maktba-flow-card">
              <span className="maktba-flow-step">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
        <Link className="maktba-cta" href={FREE_CALL_ROUTE}>
          استخدمي الكود لحجز جلسة مجانية
        </Link>
      </section>

      <section className="maktba-clarifications">
        <div className="maktba-section-head">
          <h2>لماذا سميناها «مكتبة»؟</h2>
          <p>هدفنا توفير كتب ومراجع عربية مجانية مع تجربة مستقبلية في التصميم.</p>
        </div>
        <div className="maktba-clarifications-grid">
          {CLARIFICATION_CARDS.map((card) => (
            <article key={card.id} className="maktba-clarification-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="maktba-faq">
        <div className="maktba-section-head">
          <h2>أسئلة شائعة حول المكْتَبة</h2>
          <p>هذه الإجابات توضّح كيفية حفظ الروابط، استخدام الأكواد، وخطة التوسّع القادمة.</p>
        </div>
        <Accordion items={FAQ_ITEMS} defaultOpenIds={[FAQ_ITEMS[0].id]} />
      </section>

      <ChatbotWidget />
    </div>
  )
}

function ProductGrid({ items, emptyLabel }: { items: ProductResource[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="maktba-empty">{emptyLabel}</p>
  }
  return (
    <div className="maktba-grid">
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
          slug={item.slug}
          snippet={item.snippet}
          createdAt={item.createdAt}
          primaryHref={item.slug ? `/download?product=${item.slug}` : `/download?product=${item.id}`}
          primaryLabel="تحميل مجاني"
        />
      ))}
    </div>
  )
}
