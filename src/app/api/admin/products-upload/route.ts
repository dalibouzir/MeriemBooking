import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) { return email === 'meriembouzir05@gmail.com' }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const type = String(form.get('type') || '') as 'كتاب' | 'فيديو'
  const title = String(form.get('title') || '')
  const description = String(form.get('description') || '')
  const slug = String(form.get('slug') || '')
  const snippet = String(form.get('snippet') || '')
  const file = form.get('file') as File | null
  const cover = form.get('cover') as File | null

  if (!['كتاب','فيديو'].includes(type)) return NextResponse.json({ error: 'type must be كتاب or فيديو' }, { status: 400 })
  if (!title || !description || !slug || !file) return NextResponse.json({ error: 'Missing fields or file' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const bucket = 'assets'

  // Ensure bucket exists (ignore error if exists)
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {})

  const fileExtGuess = (name: string, fallback: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (!ext) return fallback
    return ext
  }

  // Upload primary file
  const fileExt = fileExtGuess(file.name, type === 'فيديو' ? 'mp4' : 'pdf')
  const filePath = `public/${type === 'فيديو' ? 'videos' : 'books'}/${slug}.${fileExt}`
  const fileBytes = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage.from(bucket).upload(filePath, fileBytes, {
    contentType: file.type || (type === 'فيديو' ? 'video/mp4' : 'application/pdf'),
    upsert: true,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // Upload cover if provided
  let coverUrl: string | null = null
  if (cover) {
    const cExt = fileExtGuess(cover.name, 'jpg')
    const coverPath = `public/covers/${slug}.${cExt}`
    const coverBytes = Buffer.from(await cover.arrayBuffer())
    const { error: cErr } = await supabase.storage.from(bucket).upload(coverPath, coverBytes, {
      contentType: cover.type || 'image/jpeg',
      upsert: true,
    })
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(coverPath)
    coverUrl = pub?.publicUrl || null
  }

  // Build public URL for the primary file if needed by client flows
  const { data: filePub } = supabase.storage.from(bucket).getPublicUrl(filePath)
  const primaryUrl = filePub?.publicUrl || null

  // Insert into products; we store cover as URL for simplicity
  const { data, error } = await supabase
    .from('products')
    .insert({ type, title, description, cover: coverUrl || '', slug, snippet: snippet || null })
    .select('*')
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ product: data, fileUrl: primaryUrl })
}

