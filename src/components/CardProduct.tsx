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
  secondaryHref?: string
  secondaryLabel?: string
}

export default function CardProduct({
  id,
  title,
  description,
  image,
  type,
  format,
  duration,
  price,
  currency = 'د.ت',
  rating,
  reviewCount,
  tags = [],
  badge,
  bestSeller = false,
  primaryHref,
  primaryLabel = 'تحميل',
  secondaryHref,
  secondaryLabel = 'التفاصيل',
}: ProductCardProps) {
  const displayRating = typeof rating === 'number' && !Number.isNaN(rating)
  const displayPrice = typeof price === 'number' && price > 0
  const tagList = Array.from(new Set([type, format, duration, ...tags].filter(Boolean))) as string[]

  return (
    <article className={`product-card${bestSeller ? ' is-featured' : ''}`} data-product-id={id}>
      <div className="product-media">
        <div className="product-frame">
          <Image
            src={image || '/Meriem.webp'}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          />
        </div>
        {(badge || bestSeller) && (
          <span className="product-ribbon">{badge ?? 'الأكثر مبيعًا'}</span>
        )}
      </div>

      <div className="product-body">
        <header className="product-header">
          <div className="product-meta">
            {tagList.slice(0, 3).map((tag) => (
              <span key={tag} className="product-pill">
                {tag}
              </span>
            ))}
          </div>
          {displayRating && (
            <span className="product-rating" aria-label={`تقييم ${rating} من 5`}>
              ⭐ {rating?.toFixed(1)}
              {typeof reviewCount === 'number' && reviewCount > 0 && <span className="product-rating-count"> · {reviewCount} مراجعة</span>}
            </span>
          )}
        </header>

        <h3 className="product-title">{title}</h3>
        <p className="product-description">{description}</p>

        {displayPrice && (
          <div className="product-price">
            <span className="product-price-number">{price}</span>
            <span className="product-price-currency">{currency}</span>
            <span className="product-price-note">يشمل موارد قابلة للتنزيل</span>
          </div>
        )}

        <div className="product-actions">
          <Link href={primaryHref} className="btn btn-primary product-btn">
            {primaryLabel}
          </Link>
          {secondaryHref && (
            <Link href={secondaryHref} className="btn product-btn-secondary">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
