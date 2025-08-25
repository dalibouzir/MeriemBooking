'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

type Product = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number
  reviews: number
  slug: string
  snippet?: string
}

const products: Product[] = [
  {
    id: 'p1',
    type: 'كتاب',
    title: 'دفتر الاتزان العاطفي',
    description:
      'تمارين عملية لتهدئة الجهاز العصبي وبناء حدود صحية بلغة بسيطة للأمهات.',
    cover: '/covers/book-balance.webp',
    rating: 4.9,
    reviews: 128,
    slug: 'emotional-balance-workbook',
    snippet:
      'هذا الدفتر يعلمك كيف تقولين «لا» بحب، وتسترجعين هدوءك في 10 دقائق يوميًا.',
  },
  {
    id: 'p2',
    type: 'فيديو',
    title: 'تهدئة الناقد الداخلي (ماستر كلاس)',
    description:
      'فيديو تطبيقي خطوة بخطوة لتليين النقد الذاتي وبناء ثقة بالنفس قابلة للتطبيق.',
    cover: '/covers/video-inner-critic.webp',
    rating: 4.8,
    reviews: 96,
    slug: 'heal-inner-critic-masterclass',
  },
  {
    id: 'p3',
    type: 'كتاب',
    title: 'الحدود للأمهات',
    description:
      'جُمل جاهزة وتمارين قصيرة لتحديد الحدود بدون شعور بالذنب وحماية طاقتك.',
    cover: '/covers/book-boundaries.webp',
    rating: 4.7,
    reviews: 83,
    slug: 'boundaries-for-moms',
    snippet:
      'مقتطف: «أنا أحبك، وبنفس الوقت أحتاج 15 دقيقة راحة، نكمل بعدهم».',
  },
]

export default function StorefrontPage() {
  return (
    <div id="storefront" dir="rtl" lang="ar" className="sf-wrapper">
      {/* Hero */}
      <section className="sf-hero">
        <h1 className="sf-title">كتب وفيديوهات من مريم</h1>
        <p className="sf-subtitle">
          عند تنزيل أي منتج، تتحصل/ين على <span className="sf-bold">توكن مجاني</span> لحجز مكالمة 1:1.
        </p>
        <div className="sf-hero-actions">
          <Link href="/free-call" className="sf-cta">
            عندي توكن — نحب نحجز المكالمة
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="sf-grid">
        {products.map((p) => (
          <motion.article
            key={p.id}
            className="sf-card"
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          >
            <div className="sf-media">
              <img src={p.cover} alt={p.title} className="sf-img" />
              <span className={`sf-badge ${p.type === 'فيديو' ? 'sf-badge-video' : 'sf-badge-book'}`}>
                {p.type}
              </span>
            </div>

            <div className="sf-body">
              <div className="sf-meta">
                <span className="sf-reviews">
                  ⭐ {p.rating.toFixed(1)} · {p.reviews} مراجعة
                </span>
              </div>

              <h2 className="sf-card-title">{p.title}</h2>

              <p className="sf-desc clamp-2">{p.description}</p>

              {p.type === 'كتاب' && p.snippet && (
                <div className="sf-snippet">
                  <span className="sf-snippet-label">مقتطف:</span>
                  <p className="sf-snippet-text clamp-2">{p.snippet}</p>
                </div>
              )}

              {p.type === 'فيديو' && (
                <p className="sf-video-note">🎬 فيديو تطبيقي + ملف مرفق للنوتس.</p>
              )}

              <div className="sf-actions">
                <Link href={`/download?product=${p.slug}`} className="sf-btn sf-btn-primary">
                  تحميل
                </Link>
              </div>

              <p className="sf-bonus">🎁 بعد إدخال معلوماتك يصلك الإيميل: رابط التنزيل + كود مكالمة مجانية.</p>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  )
}
