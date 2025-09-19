import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) {
  return email === 'meriembouzir05@gmail.com'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('id, type, title, description, cover, rating, reviews, slug, snippet, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const { type, title, description, cover, slug, snippet, rating, reviews } = body as Record<string, unknown>
  if (type !== 'كتاب' && type !== 'فيديو') return NextResponse.json({ error: 'type must be كتاب or فيديو' }, { status: 400 })
  if (typeof title !== 'string' || typeof description !== 'string' || typeof cover !== 'string' || typeof slug !== 'string') {
    return NextResponse.json({ error: 'title, description, cover, slug are required' }, { status: 400 })
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .insert({ type, title, description, cover, slug, snippet: snippet ?? null, rating: rating ?? undefined, reviews: reviews ?? undefined })
    .select('*')
    .single()
  if (error) {
    const err = error as { code?: string; message: string }
    const isDup = err.code === '23505' || /duplicate|unique/i.test(err.message || '')
    return NextResponse.json({ error: isDup ? 'Slug already exists' : error.message }, { status: isDup ? 409 : 500 })
  }
  return NextResponse.json({ product: data })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()
  const contentType = req.headers.get('content-type') || ''
  const bucket = 'assets'

  const removeOldFiles = async (folder: string, slug: string, keepPath?: string) => {
    if (!slug) return
    const { data: files } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: 200, search: slug })
    if (!files?.length) return
    const targets = files
      .filter((f) => f.name.startsWith(slug) && `${folder}/${f.name}` !== keepPath)
      .map((f) => `${folder}/${f.name}`)
    if (targets.length) await supabase.storage.from(bucket).remove(targets).catch(() => null)
  }

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const id = String(form.get('id') || '').trim()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const existingRes = await supabase
      .from('products')
      .select('type, title, description, cover, slug, snippet, rating, reviews')
      .eq('id', id)
      .maybeSingle()
    if (existingRes.error) return NextResponse.json({ error: existingRes.error.message }, { status: 500 })
    if (!existingRes.data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const existing = existingRes.data

    const getText = (key: string) => {
      const value = form.get(key)
      return typeof value === 'string' ? value : undefined
    }

    const typeInput = getText('type')
    const slugInput = getText('slug')

    const updatedType = typeInput ?? existing.type
    const updatedSlug = (slugInput ?? existing.slug).trim()

    const update: Record<string, unknown> = {}

    const titleInput = getText('title')
    const descInput = getText('description')
    const snippetInput = getText('snippet')
    const ratingInput = getText('rating')
    const reviewsInput = getText('reviews')

    if (typeInput) update.type = typeInput
    if (titleInput !== undefined) update.title = titleInput
    if (descInput !== undefined) update.description = descInput
    if (slugInput !== undefined) update.slug = slugInput
    if (snippetInput !== undefined) update.snippet = snippetInput || null

    if (ratingInput !== undefined) {
      const parsed = Number(ratingInput)
      update.rating = Number.isFinite(parsed) ? parsed : null
    }
    if (reviewsInput !== undefined) {
      const parsed = Number(reviewsInput)
      update.reviews = Number.isFinite(parsed) ? parsed : null
    }

    const fileEntry = form.get('file')
    const coverEntry = form.get('cover')
    const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null
    const cover = coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null

    if (file) {
      const folder = updatedType === 'فيديو' ? 'public/videos' : 'public/books'
      const ext = (file.name.split('.').pop() || (updatedType === 'فيديو' ? 'mp4' : 'pdf')).toLowerCase()
      const path = `${folder}/${updatedSlug}.${ext}`
      const bytes = Buffer.from(await file.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, bytes, {
          contentType: file.type || (updatedType === 'فيديو' ? 'video/mp4' : 'application/pdf'),
          upsert: true,
        })
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

      await removeOldFiles(folder, updatedSlug, path)

      if (existing.slug !== updatedSlug || existing.type !== updatedType) {
        const oldFolder = existing.type === 'فيديو' ? 'public/videos' : 'public/books'
        await removeOldFiles(oldFolder, existing.slug)
      }
    }

    if (cover) {
      const ext = (cover.name.split('.').pop() || 'jpg').toLowerCase()
      const folder = 'public/covers'
      const path = `${folder}/${updatedSlug}.${ext}`
      const bytes = Buffer.from(await cover.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, bytes, {
          contentType: cover.type || 'image/jpeg',
          upsert: true,
        })
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      await removeOldFiles(folder, updatedSlug, path)
      if (existing.slug !== updatedSlug) {
        await removeOldFiles(folder, existing.slug)
      }
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
      update.cover = pub?.publicUrl || path
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ product: existing })
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product: data })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { id, ...rest } = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  const fields = ['type', 'title', 'description', 'cover', 'slug', 'snippet', 'rating', 'reviews'] as const
  for (const f of fields) if (f in rest) (update as Record<string, unknown>)[f] = (rest as Record<string, unknown>)[f]
  const { data, error } = await supabase
    .from('products')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
