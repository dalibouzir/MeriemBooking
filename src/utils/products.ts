import { supabaseClient } from '@/lib/supabase'

export type LibraryItemRow = {
  id: string
  type: 'book' | 'video'
  title: string
  description: string | null
  public_url: string | null
  thumbnail_path: string | null
  price: number | null
  created_at?: string
}

export type LegacyProductRow = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string | null
  rating: number | null
  reviews: number | null
  slug: string
  snippet: string | null
  created_at?: string
}

export type ProductResource = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number
  reviews: number
  slug: string
  snippet?: string
  format?: string
  duration?: string
  price?: number
  downloadUrl?: string
  badge?: string
  createdAt?: string
}

export async function mapLibraryItems(rows: LibraryItemRow[]): Promise<ProductResource[]> {
  return Promise.all(
    rows.map(async (item) => {
      let cover = '/Meriem.webp'
      if (item.thumbnail_path) {
        const { data } = supabaseClient.storage.from('library').getPublicUrl(item.thumbnail_path)
        if (data?.publicUrl) cover = data.publicUrl
      }

      return {
        id: item.id,
        type: item.type === 'video' ? 'فيديو' : 'كتاب',
        title: item.title,
        description: item.description || 'ملف عملي يحتوي على تمارين وتوجيهات مباشرة قابلة للتطبيق فورًا.',
        snippet: item.description ? createSnippet(item.description) : undefined,
        cover,
        rating: 4.9,
        reviews: 128,
        slug: item.id,
        format: item.type === 'video' ? 'فيديو تعليمي' : 'كتاب PDF',
        duration: item.type === 'video' ? '20 دقيقة' : '12 صفحة عملية',
        price: item.price ?? 0,
        downloadUrl: item.public_url ?? undefined,
        badge: item.type === 'video' ? 'جديد' : undefined,
        createdAt: item.created_at,
      }
    }),
  )
}

export function mapLegacyProducts(rows: LegacyProductRow[]): ProductResource[] {
  return rows.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    cover: item.cover || '/Meriem.webp',
    rating: item.rating ?? 5,
    reviews: item.reviews ?? 0,
    slug: item.slug,
    snippet: item.snippet ?? createSnippet(item.description),
    format: item.type === 'فيديو' ? 'فيديو تعليمي' : 'كتاب PDF',
    duration: item.type === 'فيديو' ? '25 دقيقة' : '10 صفحات مركّزة',
    badge: item.snippet ? 'لمحة سريعة' : undefined,
    createdAt: item.created_at,
  }))
}

function createSnippet(text: string, maxLength = 140): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}
