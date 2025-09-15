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
    const isDup = (error as any).code === '23505' || /duplicate|unique/i.test((error as any).message || '')
    return NextResponse.json({ error: isDup ? 'Slug already exists' : error.message }, { status: isDup ? 409 : 500 })
  }
  return NextResponse.json({ product: data })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { id, ...rest } = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  const fields = ['type','title','description','cover','slug','snippet','rating','reviews'] as const
  for (const f of fields) if (f in rest) (update as any)[f] = (rest as any)[f]
  const supabase = getSupabaseAdmin()
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

