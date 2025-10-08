'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
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

const HOW_IT_WORKS = [
  {
    title: 'اختاري موردًا أو جلسة',
    description: 'ابدئي بتحميل كتاب أو مشاهدة فيديو يشرح الخطوات الافتتاحية، أو احجزي جلسة مباشرة مع مريم.',
    icon: '📚',
  },
  {
    title: 'طبّقي خطوة صغيرة كل يوم',
    description: 'كل مورد يحتوي على تمارين سريعة ونماذج جاهزة لتسهيل التنفيذ داخل البيت ومع الأطفال.',
    icon: '🧭',
  },
  {
    title: 'تابعينا للمساءلة والدعم',
    description: 'استخدمي الدردشة أو النماذج لمشاركة تقدّمك والحصول على تعديلات مخصّصة في أي وقت.',
    icon: '💬',
  },
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

const BOOKING_URL = 'https://calendly.com/meriembouzir/30min'

type SocialLink = {
  href: string
  label: string
  icon: string
  variant?: 'linktree'
}

const SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://linktr.ee/meriembouzir', label: 'Linktree', icon: '🌿', variant: 'linktree' },
  { href: 'https://www.instagram.com/fittrah.moms', label: 'Instagram', icon: '📸' },
  { href: 'https://www.youtube.com/@fittrahmoms', label: 'YouTube', icon: '▶️' },
  { href: 'https://wa.me/21629852313', label: 'WhatsApp', icon: '💬' },
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

  const featuredProducts = useMemo(() => resources.slice(0, 3), [resources])
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  return (
    <div className="home-page">
      <section className="home-hero-block">
        <motion.div
          className="home-hero-wrap"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
        >
          <div className="home-hero-content">
            <span className="home-hero-tag">مرافقة أسرية بالعربية</span>
            <h1 className="home-hero-title">تنظيم لطيف يعيد الهدوء لبيتك</h1>
            <p className="home-hero-text">
              مريم بوزير ترافق الأمهات بخطوات واقعية، تجمع بين جلسات علاج معرفي سلوكي وملفات رقمية جاهزة للعمل فورًا داخل البيت. نضع خطة قصيرة، ثم نبقى معك للمساءلة والطمأنة.
            </p>
            <div className="home-hero-actions">
              <Link
                href={BOOKING_URL}
                className="btn btn-primary home-hero-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                احجزي جلسة شخصية
              </Link>
              <Link href="/products" className="btn home-hero-secondary">
                استكشفي المتجر
              </Link>
            </div>
            <dl className="home-hero-stats">
              <div className="home-stat-item">
                <dt>جلسات منجزة</dt>
                <dd>+1800</dd>
              </div>
              <div className="home-stat-item">
                <dt>خطة خلال أسبوع</dt>
                <dd>7 أيام</dd>
              </div>
              <div className="home-stat-item">
                <dt>تحميل فوري</dt>
                <dd>24/7</dd>
              </div>
            </dl>
          </div>
          <div className="home-hero-media">
            <Image
              src="/Meriem.webp"
              alt="مريم بوزير — مرافقة الأمهات"
              fill
              sizes="(max-width: 960px) 80vw, 420px"
              priority
            />
            <span className="home-hero-media-fade" aria-hidden />
          </div>
        </motion.div>
      </section>

      <section className="home-intro">
        <div className="home-intro-wrap">
          <h2>رحلة صغيرة لكن ثابتة</h2>
          <p>
            كل جلسة أو ملف نشاركه معك يركّز على خطوة واحدة قابلة للتطبيق فورًا. نراجعها سويًا، ثم نضيف عليها تدريجيًا حتى تشعري أن البيت يتحرّك بنَفَس أهدأ.
          </p>
          <ol className="home-timeline">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="home-timeline-step">
                <span className="home-timeline-index">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="resources" className="home-featured">
        <div className="home-section-head">
          <h2>ملفات جاهزة للتحميل ومشاهدة فورية</h2>
          <p>اختاري كتابًا عمليًا أو جلسة فيديو مختصرة. كل مورد مرفق بنماذج للعمل وخطوات يومية سهلة التطبيق.</p>
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
          <div className="home-product-rail">
            {featuredProducts.map((item) => {
              const primaryHref = item.downloadUrl ? item.downloadUrl : `/download?product=${item.slug}`
              const secondaryHref = `/download?product=${item.slug}`
              const tagList = Array.from(
                new Set([item.type, item.format, item.duration].filter(Boolean)),
              ) as string[]

              return (
                <article key={item.id} className="home-product-card">
                  <div className="home-product-cover">
                    <Image
                      src={item.cover || '/Meriem.webp'}
                      alt={item.title}
                      fill
                      sizes="(max-width: 720px) 100vw, 320px"
                    />
                  </div>
                  <div className="home-product-info">
                    <span className="home-product-type">{item.type}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.price ? (
                      <p className="home-product-price">
                        <span>{item.price}</span>
                        <span className="home-product-currency">{item.currency ?? 'د.ت'}</span>
                      </p>
                    ) : (
                      <p className="home-product-price free">مجاني مع رمز جلسة</p>
                    )}
                    {!!tagList.length && (
                      <div className="home-product-tags">
                        {tagList.map((tag) => (
                          <span key={`${item.id}-${tag}`} className="home-product-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="home-product-actions">
                      <Link href={primaryHref} className="btn btn-primary home-product-btn">
                        {item.type === 'فيديو' ? 'مشاهدة فورية' : 'تحميل فوري'}
                      </Link>
                      <Link href={secondaryHref} className="home-product-secondary">
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="home-featured-more">
          <Link href="/products" className="home-featured-link">
            تصفّح المتجر الكامل
          </Link>
        </div>
      </section>

      <section className="home-story">
        <div className="home-story-wrap">
          <h2>مريم بوزير — معالجة معرفية سلوكية ترافقك خطوة بخطوة</h2>
          <p>
            نعمل مع الأمهات اللواتي يرغبن في تهدئة التوتر اليومي وبناء حدود محبة داخل البيت. تشمل المرافقة مراجعة روتينك، تصميم تمارين صغيرة، ومتابعة أسبوعية برسائل قصيرة.
          </p>
          <ul className="home-story-points">
            <li>جلسات خاصة عبر Google Meet مع تلخيص مكتوب لكل ما اتفقنا عليه.</li>
            <li>كتب PDF وفيديوهات تطبيقية بالعربية تم اختبارها مع مئات العائلات.</li>
            <li>دعم متواصل عبر البريد أو واتساب للمساءلة وتعديل الخطط عند الحاجة.</li>
          </ul>
          <div className="home-story-actions">
            <Link
              href={BOOKING_URL}
              className="btn btn-primary home-story-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              احجزي موعد Calendly
            </Link>
            <Link href="/free-call" className="btn home-story-secondary">
              جلسة تعريفية مجانية
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
