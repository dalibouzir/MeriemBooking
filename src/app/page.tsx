// ./src/app/page.tsx
'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'

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
  downloadUrl?: string
}

/** العناصر من قاعدة البيانات */
type DbItem = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number | null
  reviews: number | null
  slug: string
  snippet: string | null
  // إن كنت ترتّب حسب created_at، احرص أن العمود موجود في الجدول
  // ويمكنك تضمينه في select لو أردت استعماله لاحقًا
}

export default function HomePage() {
  const [المنتجات, setمنتجات] = useState<منتج[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select('id, type, title, description, cover, rating, reviews, slug, snippet')
          .order('created_at', { ascending: false })
        if (error) throw error

        const mapped: منتج[] = (data as DbItem[]).map((it) => ({
          id: it.id,
          type: it.type,
          title: it.title,
          description: it.description,
          cover: it.cover || '/Meriem.webp',
          rating: (it.rating ?? 5.0) as number,
          reviews: (it.reviews ?? 0) as number,
          slug: it.slug,
          snippet: it.snippet ?? undefined,
          price: undefined, // أضِف قيمة إذا كان لديك سعر في القاعدة
          format: it.type === 'فيديو' ? 'MP4' : 'PDF',
          level: undefined,
          downloadUrl: undefined,
        }))

        if (mounted) setمنتجات(mapped)
      } catch (e) {
        console.warn('products not available; storefront will show no items')
        if (mounted) setمنتجات([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div id="storefront" dir="rtl" lang="ar" className="sf-wrapper">
      {/* ░ بطاقة ترحيبية (عنوان + دعوة للفعل) ░ */}
      <section className="sf-hero">
        <div className="hero-card">
          <h1 className="sf-title">مكتبة فطرة الأمهات</h1>
          <p className="sf-subtitle">
            موارد عملية للأمهات: كتيّبات وفيديوهات قصيرة تُساعِدك على تهدئة التوتر، ترسيخ الحدود، وبناء روتينٍ أسهل.
            عند تنزيل أي منتج، يصلك <span className="sf-bold">رمز هدية</span> لمكالمة 1:1 مجانية.
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
            <p className="info-text">تنزيل فوري بصيغة PDF/MP4 مع تجربة بسيطة وواضحة.</p>
          </div>
          <div className="info-block">
            <div className="info-icon" aria-hidden>🎟️</div>
            <div className="info-title">هدية رمز</div>
            <p className="info-text">يصلك رمز مكالمة مجانية على بريدك بعد التحميل مباشرة.</p>
          </div>
          <div className="info-block">
            <div className="info-icon" aria-hidden>📞</div>
            <div className="info-title">مكالمة 1:1</div>
            <p className="info-text">جلسة مركّزة تساعدك على تطبيق الخطوات بما يناسب ظروفك.</p>
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
                    {/* أزلنا خاصية currency واعتمدنا على نص ثابت */}
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
                  href={`/download?product=${p.slug}`}
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
