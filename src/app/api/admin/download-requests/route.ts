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
    .from('download_requests')
    .select('id, created_at, name, first_name, last_name, email, product_slug, phone')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}
