'use client'

import Image from 'next/image'
import Link from 'next/link'

export type ProductCardProps = {
  id: string
  title: string
  description: string
  image?: string | null
  type: 'كتاب' | 'فيديو' | 'دورة' | 'منتج'
  format?: string
  duration?: string
  price?: number
  currency?: string
  rating?: number
  reviewCount?: number
  tags?: string[]
  badge?: string
  bestSeller?: boolean
  primaryHref: string
  primaryLabel?: string
  slug?: string
  snippet?: string
  createdAt?: string
}

export default function CardProduct({
  id,
  title,
  description,
  image,
  price,
  badge,
  bestSeller = false,
  primaryHref,
  primaryLabel = 'تحميل مجاني',
  snippet,
  createdAt,
}: ProductCardProps) {
  const isFree = typeof price !== 'number' || price <= 0
  const createdLabel = createdAt ? formatCreatedAt(createdAt) : null
  const ribbonLabel = badge ?? (bestSeller ? 'مميز' : undefined)
  const externalDownload = /^https?:\/\//i.test(primaryHref)
  const normalizedSnippet = snippet?.trim()

  const downloadButton = externalDownload ? (
    <a href={primaryHref} className="btn product-btn product-btn-download">
      {primaryLabel}
    </a>
  ) : (
    <Link href={primaryHref} className="btn product-btn product-btn-download" scroll={false} prefetch={false}>
      {primaryLabel}
    </Link>
  )

  return (
    <article className={`product-card${bestSeller ? ' is-featured' : ''}`} data-product-id={id}>
      {ribbonLabel && <span className="product-ribbon">{ribbonLabel}</span>}

      <div className="product-media">
        <Image
          src={image || '/Meriem.jpeg'}
          alt={title}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 280px"
          priority={false}
        />
      </div>

      <div className="product-body">
        <header className="product-header">
          <h3 className="product-title">{title}</h3>
          {createdLabel && (
            <time className="product-date" dateTime={createdAt ?? undefined}>
              {createdLabel}
            </time>
          )}
        </header>

        <div className="product-text-grid">
          <div className="product-text-block">
            <span className="product-text-label" aria-hidden>
              الوصف
            </span>
            <p className="product-description">{description}</p>
          </div>
          {normalizedSnippet ? (
            <div className="product-text-block">
              <span className="product-text-label" aria-hidden>
                لمحة
              </span>
              <p className="product-snippet-text">{normalizedSnippet}</p>
            </div>
          ) : null}
        </div>

        <div className="product-actions">
          {downloadButton}
          {isFree ? <span className="product-free-note">تحميل مجاني فورًا</span> : null}
        </div>
      </div>
    </article>
  )
}

function formatCreatedAt(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  try {
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}
