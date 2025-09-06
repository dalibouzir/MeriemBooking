import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { randomUUID } from 'crypto'

function isAdminEmail(email?: string | null) {
  return !!email && email === process.env.MERIEM_ADMIN_EMAIL
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const form = await req.formData()
  const type = String(form.get('type') || '')
  const title = String(form.get('title') || '')
  const description = String(form.get('description') || '')
  const price = form.get('price') ? Number(form.get('price')) : null
  const file = form.get('file') as File | null
  const thumb = form.get('thumbnail') as File | null

  if (!['book', 'video'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!title || !file) {
    return NextResponse.json({ error: 'Missing title or file' }, { status: 400 })
  }

  const bucket = 'library'
  const id = randomUUID()
  const ext = file.name.split('.').pop() || (type === 'book' ? 'pdf' : 'mp4')
  const filePath = `${type}s/${id}.${ext}`

  // Upload main file
  const fileBytes = Buffer.from(await file.arrayBuffer())
  try {
    const supabase = getSupabaseAdmin()
    // Ensure storage bucket exists (create if missing)
    const createRes = await supabase.storage.createBucket(bucket, { public: true })
    if (createRes.error) {
      // If it's not an "already exists" scenario, verify and bail if absent
      const { data: buckets } = await supabase.storage.listBuckets()
      type BucketInfo = { id: string; name: string }
      const exists = Array.isArray(buckets) && (buckets as BucketInfo[]).some((b) => b.name === bucket)
      if (!exists) {
        return NextResponse.json({ error: `Storage bucket "${bucket}" not found and could not be created: ${createRes.error.message}` }, { status: 500 })
      }
    }

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBytes, {
        contentType: file.type || (type === 'book' ? 'application/pdf' : 'video/mp4'),
        upsert: false,
      })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // Optional thumbnail
  let thumbnail_path: string | null = null
  if (thumb) {
    const tExt = thumb.name.split('.').pop() || 'jpg'
    const thumbPath = `thumbnails/${id}.${tExt}`
    const thumbBytes = Buffer.from(await thumb.arrayBuffer())
    const { error: thErr } = await supabase.storage
      .from(bucket)
      .upload(thumbPath, thumbBytes, {
        contentType: thumb.type || 'image/jpeg',
        upsert: false,
      })
    if (thErr) return NextResponse.json({ error: thErr.message }, { status: 500 })
    thumbnail_path = thumbPath
  }

  const { data: pub } = getSupabaseAdmin().storage.from(bucket).getPublicUrl(filePath)
  const public_url = pub?.publicUrl || null

  const { data, error } = await getSupabaseAdmin()
    .from('library_items')
    .insert({
      id,
      type,
      title,
      description,
      file_path: filePath,
      public_url,
      thumbnail_path,
      price,
    })
    .select('*')
    .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body || !body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { id, title, description, price } = body as { id: string; title?: string; description?: string; price?: number | null }
  const update: Partial<{ title: string; description: string; price: number | null; updated_at: string }> = { updated_at: new Date().toISOString() }
  if (typeof title === 'string') update.title = title
  if (typeof description === 'string') update.description = description
  if (typeof price === 'number' || price === null) update.price = price

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
    .from('library_items')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const supabase = getSupabaseAdmin()
    // Get item to know file path(s)
    const { data: item, error: getErr } = await supabase
    .from('library_items')
    .select('file_path, thumbnail_path')
    .eq('id', id)
    .single()
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 })

  const bucket = 'library'
  if (item?.file_path) {
    await supabase.storage.from(bucket).remove([item.file_path])
  }
  if (item?.thumbnail_path) {
    await supabase.storage.from(bucket).remove([item.thumbnail_path])
  }
    const { error } = await supabase.from('library_items').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
