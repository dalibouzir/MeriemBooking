'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

type منتج = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number
  reviews: number
  slug: string
  snippet?: string
  price?: number
  format?: string
  level?: string
}

/** كتاب واحد فقط */
const المنتجات: منتج[] = [
  {
    id: 'p1',
    type: 'كتاب',
    title: 'دفتر الاتزان العاطفي',
    description:
      'تمارين عملية لتهدئة الجهاز العصبي وبناء حدود صحية بلغة لطيفة للأمهات.',
    cover: '/book_cover.webp', // ← file in /public
    rating: 4.9,
    reviews: 128,
    slug: 'emotional-balance-workbook',
    snippet: 'يُعينك كيف تقولين «لا» بحب، وتسترجعين هدوءك في 10 دقائق يوميًا.',
    price: 29,
    format: 'PDF',
    level: 'مبتدئ',
  },
]

export default function الصفحة_الرئيسية() {
  return (
    <div id="storefront" dir="rtl" lang="ar" className="sf-wrapper">
      {/* ░ بطاقة ترحيبية (عنوان + دعوة للفعل) ░ */}
      <section className="sf-hero">
        <div className="hero-card">
          <h1 className="sf-title">كتب وفيديوهات من مريم</h1>
          <p className="sf-subtitle">
            عند تنزيل أي منتج، تتحصل/ين على <span className="sf-bold">رمز مجاني</span> لحجز مكالمة 1:1 شخصية.
          </p>
          <div className="sf-hero-actions">
            <Link href="/free-call" className="sf-cta" aria-label="الانتقال إلى حجز مكالمة فردية">
              عندي رمز — أريد الحجز الآن
            </Link>
          </div>
        </div>

        {/* ░ كتل معلومات موجزة ░ */}
        <div className="info-grid">
          <div className="info-block">
            <div className="info-icon" aria-hidden>📕</div>
            <div className="info-title">تحميل مباشر</div>
            <p className="info-text">احصلي على كُتيّب عملي يهدّئ التوتر ويُرسّخ الحدود الصحية.</p>
          </div>
          <div className="info-block">
            <div className="info-icon" aria-hidden>🎟️</div>
            <div className="info-title">هدية رمز</div>
            <p className="info-text">بعد إدخال بياناتك يصل رمز مكالمة مجانية إلى بريدك الإلكتروني.</p>
          </div>
          <div className="info-block">
            <div className="info-icon" aria-hidden>📞</div>
            <div className="info-title">مكالمة 1:1</div>
            <p className="info-text">استخدمي الرمز لحجز جلسة مركّزة تُناسب وضعك وحاجتك.</p>
          </div>
        </div>
      </section>

      {/* ░ شبكة المنتجات (بطاقة واحدة محسّنة) ░ */}
      <section className="sf-grid">
        {المنتجات.map((p) => (
          <motion.article
            key={p.id}
            className="sf-card"
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          >
            {/* ريبون أعلى البطاقة */}
            <div className="sf-ribbon" aria-hidden>الأكثر طلبًا</div>

            <div className="sf-media">
              {/* عناصر تجميلية للغلاف */}
              <div className="sf-book-spine" aria-hidden />
              <img
                src={p.cover}
                alt={p.title}
                className="sf-img"
                loading="lazy"
              />
              <div className="sf-overlay" aria-hidden />
              <span className={`sf-badge ${p.type === 'فيديو' ? 'sf-badge-video' : 'sf-badge-book'}`}>
                {p.type}
              </span>
            </div>

            <div className="sf-body">
              <div className="sf-meta">
                <span className="sf-reviews">⭐ {p.rating.toFixed(1)} · {p.reviews} مراجعة</span>

                {/* شرائط سريعة */}
                <div className="sf-pills">
                  {p.format && <span className="sf-pill">{p.format}</span>}
                  {p.level && <span className="sf-pill">{p.level}</span>}
                </div>
              </div>

              <h2 className="sf-card-title">{p.title}</h2>
              <p className="sf-desc clamp-2">{p.description}</p>

              {p.type === 'كتاب' && p.snippet && (
                <div className="sf-snippet">
                  <span className="sf-snippet-label">مقتطف:</span>
                  <p className="sf-snippet-text clamp-2">{p.snippet}</p>
                </div>
              )}

              {/* نقاط مختصرة للفائدة */}
              <ul className="sf-bullets" aria-label="فوائد مختصرة">
                <li>خطوات عملية واضحة</li>
                <li>تمارين قصيرة تشتغل</li>
                <li>قوالب جاهزة للحدود</li>
              </ul>

              {/* السعر */}
              {typeof p.price === 'number' && (
                <div className="sf-price-block">
                  <div className="sf-price">
                    <span className="sf-price-number">{p.price}</span>
                    <span className="sf-price-currency">د.ت</span>
                  </div>
                  <div className="sf-price-note">يشمل رمز مكالمة مجانية</div>
                </div>
              )}

              {/* أزرار الإجراء */}
              <div className="sf-actions">
                <Link
                  href={`/download?product=${p.slug}`}
                  className="sf-btn sf-btn-primary"
                  aria-label={`تحميل ${p.title}`}
                >
                  تحميل
                </Link>
                <Link
                  href={`/preview/${p.slug}`}
                  className="sf-btn sf-btn-outline"
                  aria-label={`معاينة ${p.title}`}
                >
                  معاينة
                </Link>
              </div>

              {/* صفّ طمأنة */}
              <div className="sf-trust-row" aria-hidden>
                <span>⚡ تحميل فوري</span>
                <span>🔒 بياناتك آمنة</span>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  )
}
