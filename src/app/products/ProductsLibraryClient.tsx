'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import {
  mapLegacyProducts,
  mapLibraryItems,
  type LegacyProductRow,
  type LibraryItemRow,
  type ProductResource,
} from '@/utils/products'

type FilterKey = 'all' | 'book' | 'video'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'book', label: 'كتب' },
  { key: 'video', label: 'فيديو' },
]

export default function ProductsLibraryClient() {
  const [resources, setResources] = useState<ProductResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  useEffect(() => {
    let cancelled = false

    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(null)

        const library = await supabaseClient
          .from('library_items')
          .select('*')
          .order('created_at', { ascending: false })

        if (!library.error && Array.isArray(library.data)) {
          const mapped = await mapLibraryItems(library.data as LibraryItemRow[])
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
        if (!cancelled) setError('حدث خطأ غير متوقع أثناء تحميل الموارد.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchResources()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredResources = useMemo(() => {
    if (activeFilter === 'all') return resources
    if (activeFilter === 'book') return resources.filter((item) => item.type === 'كتاب')
    return resources.filter((item) => item.type === 'فيديو')
  }, [activeFilter, resources])

  return (
    <section className="library-hero" aria-labelledby="library-shelf-title">
      <div className="library-section-head appear-on-scroll">
        <div>
          <h1 className="library-hero-title">المكتبة</h1>
          <h2 id="library-shelf-title">ملفات مجانية جاهزة للتطبيق</h2>
          <p>اختاري الملف المناسب وابدئي التحميل مباشرة.</p>
        </div>
      </div>

      <div className="library-filter-tabs" role="tablist" aria-label="تصفية المكتبة">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.key}
            className={`library-filter-tab${activeFilter === filter.key ? ' is-active' : ''}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="library-status-bar">
        <span>الموارد المتاحة</span>
        <span className="library-status-pill">{filteredResources.length}</span>
      </div>

      {loading && <div className="library-empty">جاري تحميل الملفات…</div>}
      {!loading && error && <div className="library-error">{error}</div>}
      {!loading && !error && filteredResources.length === 0 && (
        <div className="library-empty">لا توجد ملفات ضمن هذا التصنيف حاليًا.</div>
      )}

      {!loading && !error && filteredResources.length > 0 && (
        <>
          <p className="library-grid-hint">اسحبي لليمين واليسار لاستعراض جميع الملفات</p>
          <div className="library-grid">
            {filteredResources.map((item, index) => (
              <article
                key={item.id}
                className="library-card appear-on-scroll is-visible"
                style={{ '--delay': `${0.06 + index * 0.04}s` } as CSSProperties}
              >
                <div className="library-card-cover">
                  <Link
                    href={`/download?product=${encodeURIComponent(item.slug || item.id)}`}
                    className="library-card-cover-link"
                    aria-label={`فتح ${item.title}`}
                  >
                    <img src={item.cover} alt={item.title} loading="lazy" />
                  </Link>
                  {item.badge ? <span className="library-card-badge">{item.badge}</span> : null}
                </div>

                <h3 className="library-card-title">{item.title}</h3>
                <p className="library-card-desc">{item.snippet || item.description}</p>

                <div className="library-card-meta">
                  {item.format ? <span className="library-card-meta-item">{item.format}</span> : null}
                  {item.duration ? <span className="library-card-meta-item">{item.duration}</span> : null}
                </div>

                <div className="library-card-actions">
                  <Link href={`/download?product=${encodeURIComponent(item.slug || item.id)}`} className="library-card-btn">
                    تحميل الآن
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
