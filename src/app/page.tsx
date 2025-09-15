'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import AdminLibraryManager from '@/components/AdminLibraryManager'

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

type DbItem = {
  id: string
  type: 'book' | 'video'
  title: string
  description: string | null
  public_url: string | null
  thumbnail_path: string | null
  price: number | null
}

type DbProduct = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number | null
  reviews: number | null
  slug: string
  snippet: string | null
}

export default function HomePage() {
  const [المنتجات, setمنتجات] = useState<منتج[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error } = await supabaseClient
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && Array.isArray(data)) {
        const mapped: منتج[] = (data as DbItem[]).map((it) => {
          const isVideo = it.type === 'video'
          let cover = '/Meriem.webp'
          if (it.thumbnail_path) {
            const { data: pub } = supabaseClient.storage
              .from('library')
              .getPublicUrl(it.thumbnail_path)
            if (pub?.publicUrl) cover = pub.publicUrl
          }
          return {
            id: it.id,
            type: isVideo ? 'فيديو' : 'كتاب',
            title: it.title,
            description: it.description || '',
            cover,
            rating: 4.9,
            reviews: 128,
            slug: it.id,
            snippet: undefined,
            price: it.price ?? undefined,
            format: isVideo ? 'MP4' : 'PDF',
            level: undefined,
            downloadUrl: it.public_url || undefined,
          }
        })
        if (mounted) setمنتجات(mapped)
        return
      }

      const fallback = await supabaseClient
        .from('products')
        .select('id, type, title, description, cover, rating, reviews, slug, snippet')
        .order('created_at', { ascending: false })
      if (!fallback.error && Array.isArray(fallback.data)) {
        const mapped: منتج[] = (fallback.data as DbProduct[]).map((it) => ({
          id: it.id,
          type: it.type,
          title: it.title,
          description: it.description,
          cover: it.cover || '/Meriem.webp',
          rating: (it.rating ?? 5.0) as number,
          reviews: (it.reviews ?? 0) as number,
          slug: it.slug,
          snippet: it.snippet ?? undefined,
          price: undefined,
          format: it.type === 'فيديو' ? 'MP4' : 'PDF',
          level: undefined,
          downloadUrl: undefined,
        }))
        if (mounted) setمنتجات(mapped)
        return
      }

      if (mounted) setمنتجات([])
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div id="storefront" dir="rtl" lang="ar" className="sf-wrapper">
      {/* Hero — small image + clear intro (glass) */}
      <section className="sf-hero">
        <div className="hero-card hp-hero glass-water">
          <h1 className="sf-title">فطرة الأمهات — إرشاد أسري عملي</h1>
          <p className="sf-subtitle">
            موارد قصيرة قابلة للتطبيق + مكالمات إرشاد تساعدك على بناء روتين أهدأ وحدود صحّية.
            كمستخدمة يمكنك تنزيل الكتيّبات والفيديوهات، وبعد كل تنزيل يصلك رمز هدية لتستفيدي من مكالمة مجانية.
          </p>
          <ul className="hp-intro-list">
            <li>تنزيل كتب وفيديوهات قصيرة (PDF/MP4) بخطوات عملية واضحة</li>
            <li>مكالمة إرشاد 60 دقيقة (150 د.ت) لتخصيص الخطة لما يناسبك</li>
            <li>بعد كل تنزيل يصلك رمز هدية لمكالمة مجانية — استبدليه لاحقًا</li>
          </ul>
          <p className="hp-intro-more">يمكنك استبدال رمز الهدية عبر صفحة الحجز، أو الحجز مباشرة عبر Calendly إن أردت جلسة مدفوعة الآن.</p>
          <div className="sf-hero-actions">
            <Link href="https://calendly.com/meriembouzir/30min" className="sf-cta" target="_blank" rel="noopener noreferrer">احجزي مكالمة — 150 د.ت</Link>
            <Link href="/redeem" className="sf-btn sf-btn-outline" aria-label="استبدال رمز الهدية" style={{ marginInlineStart: 8 }}>
              استبدال رمز الهدية
            </Link>
            <div style={{ marginInlineStart: 8 }}><AdminLibraryManager /></div>
          </div>
          <div className="hp-hero-media glass-water" aria-hidden>
            <img className="hp-hero-img hp-hero-img--small" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgonr3d8J7NwalGZmddonsQmwDMIXBNdTnwkZaSZml6qlqVtBZT0gV9Bzk-rSuY9TTG59F8FHVJyF1OtPxAuGJO_gXzv0AE7dN998GMQBEh0mbQlYTDT26hzPj0c19oOEcWY5m09c27WRt_9NsM3XNYGqvNXYybvYXrwZYPr1cL8LIqL2JTfYgfZ9wIpA/s1440/%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9%20%D8%A7%D9%84%D8%A5%D9%8A%D8%A7%D8%A8%D9%8A%D8%A9%201.jpg" alt="عائلة معًا" />
            <div className="hp-hero-gradient" />
          </div>
          <div className="hp-hero-pills">
            <span className="hp-pill">هدوء</span>
            <span className="hp-pill">حدود</span>
            <span className="hp-pill">روتين</span>
          </div>
        </div>
      </section>

      {/* Products — right under hero */}
      <section className="sf-grid">
        {المنتجات.map((p) => (
          <motion.article key={p.id} className="sf-card" whileHover={{ y: -8, scale: 1.01 }} transition={{ type: 'spring', stiffness: 250, damping: 22 }}>
            <div className="sf-ribbon" aria-hidden>الأكثر طلبًا</div>
            <div className="sf-media">
              <div className="sf-book-spine" aria-hidden />
              <img src={p.cover} alt={p.title} className="sf-img" loading="lazy" />
              <div className="sf-overlay" aria-hidden />
              <span className={`sf-badge ${p.type === 'فيديو' ? 'sf-badge-video' : 'sf-badge-book'}`}>{p.type}</span>
            </div>
            <div className="sf-body">
              <div className="sf-meta">
                <span className="sf-reviews">⭐ {p.rating.toFixed(1)} · {p.reviews} مراجعة</span>
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
              <ul className="sf-bullets" aria-label="فوائد مختصرة">
                <li>خطوات عملية واضحة</li>
                <li>تمارين قصيرة</li>
                <li>قوالب حدود</li>
              </ul>
              {typeof p.price === 'number' && (
                <div className="sf-price-block">
                  <div className="sf-price"><span className="sf-price-number">{p.price}</span><span className="sf-price-currency">د.ت</span></div>
                  <div className="sf-price-note">يشمل رمز مكالمة</div>
                </div>
              )}
              <div className="sf-actions">
                <Link href={`/download?product=${p.slug}`} className="sf-btn sf-btn-primary">تحميل</Link>
                <Link href={`/download?product=${p.slug}`} className="sf-btn sf-btn-outline">معاينة</Link>
              </div>
              <div className="sf-trust-row" aria-hidden><span>⚡ تحميل فوري</span><span>🔒 بياناتك آمنة</span></div>
            </div>
          </motion.article>
        ))}
      </section>

      {/* How it works — mini icons (no big images) */}
      <section className="hp-section hp-mini">
        <h2 className="hp-title">كيف نعمل؟</h2>
        <div className="hp-feature-grid">
          <article className="hp-feature-card glass-water"><div className="hp-feature-icon">📕</div><h3 className="hp-feature-title">اقرئي موردًا</h3><p className="hp-feature-text">PDF أو فيديو مع تمارين.</p></article>
          <article className="hp-feature-card glass-water"><div className="hp-feature-icon">🧭</div><h3 className="hp-feature-title">جربي خطوة</h3><p className="hp-feature-text">تطبيق خفيف اليوم.</p></article>
          <article className="hp-feature-card glass-water"><div className="hp-feature-icon">📞</div><h3 className="hp-feature-title">احجزي مكالمة</h3><p className="hp-feature-text">60 دقيقة لتخصيص الخطة.</p></article>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a className="sf-btn sf-btn-primary" href="https://calendly.com/meriembouzir/30min" target="_blank" rel="noopener noreferrer">احجزي مكالمة — 150 د.ت</a>
        </div>
      </section>

      {/* Calendly booking — with online session picture */}
      <section className="hp-section hp-calendly">
        <div className="hp-cal-card glass-water">
          <div className="hp-cal-media">
            <img
              src="https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_487/at%2Fliving%2F2021-05%2Fvirtual-therapy"
              alt="جلسة إرشاد عبر الإنترنت"
            />
          </div>
          <div className="hp-cal-body">
            <h2 className="hp-title" style={{ margin: 0 }}>احجزي مكالمة إرشاد — 150 د.ت</h2>
            <p className="hp-lead">
              جلسة عبر الإنترنت لمدة 60 دقيقة نحدّد فيها خطوة عملية تناسب وضعك الآن: تهدئة التوتر، وضع حدود، أو بناء روتين يومي.
            </p>
            <ul className="hp-intro-list" style={{ marginTop: 6 }}>
              <li>تحديد هدف واحد واضح للمكالمة</li>
              <li>اقتراح 2–3 خطوات عملية قصيرة</li>
              <li>ملخص بعد الجلسة + موارد ذات صلة</li>
            </ul>
            <a className="sf-btn sf-btn-primary" href="https://calendly.com/meriembouzir/30min" target="_blank" rel="noopener noreferrer">
              احجزي الآن
            </a>
          </div>
        </div>
      </section>

      {/* Contact + Social + Policies — glass cards */}
      <section className="hp-section hp-contact">
        <div className="hp-contact-grid">
          <div className="hp-contact-card glass-water">
            <h3 className="hp-feature-title">تواصلي معنا</h3>
            <p className="hp-feature-text">يسعدنا سماع اقتراحاتك واستفساراتك حول الموارد والمكالمات.</p>
            <p className="hp-feature-text"><a href="mailto:meriembouzir05@gmail.com" className="link">meriembouzir05@gmail.com</a></p>
            <div className="hp-social-row" style={{ marginTop: 8 }}>
              <a className="hp-social-link hp-linktree" href="https://linktr.ee/MeriemBouzir" target="_blank" rel="noopener noreferrer" aria-label="Linktree">
                <img className="hp-social-ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linktree.svg" alt="Linktree" /> لينكتري
              </a>
              <a className="hp-social-link" href="https://www.instagram.com/meriem.bouzir" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img className="hp-social-ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" /> انستغرام
              </a>
              <a className="hp-social-link" href="https://www.tiktok.com/@meriembouzir605" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img className="hp-social-ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg" alt="TikTok" /> تيك توك
              </a>
              <a className="hp-social-link" href="https://www.youtube.com/@Haythem.meriem.podcast" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <img className="hp-social-ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg" alt="YouTube" /> يوتيوب
              </a>
              <a className="hp-social-link" href="https://www.facebook.com/myriam.bouzir" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img className="hp-social-ico" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook" /> فيسبوك
              </a>
            </div>
          </div>
          <div className="hp-contact-card glass-water">
            <h3 className="hp-feature-title">سياسات الموقع</h3>
            <div className="hp-service-actions">
              <a href="/privacy" className="sf-btn sf-btn-outline">الخصوصية</a>
              <a href="/policy" className="sf-btn sf-btn-outline">سياسة الاستخدام</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
