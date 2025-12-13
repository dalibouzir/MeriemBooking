import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(email?: string | null) { return email === 'meriembouzir05@gmail.com' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabaseAdmin()

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [dlRes, clickRes] = await Promise.all([
    supabase
      .from('download_requests')
      .select('created_at', { count: 'exact', head: false })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase
      .from('download_clicks')
      .select('created_at, meta', { count: 'exact', head: false })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000),
  ])

  const downloads = aggregateByDay(dlRes.data || [])
  const clicks = aggregateClicksByDay(clickRes.data || [])

  return NextResponse.json({
    downloads,
    clicks,
  })
}

type WithCreatedAt = { created_at: string }
function aggregateByDay(rows: WithCreatedAt[]) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const day = normalizeDay(row.created_at)
    if (!day) continue
    map.set(day, (map.get(day) || 0) + 1)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, count]) => ({ day, count }))
}

type ClickRow = { created_at: string; meta?: { event?: string } | null }
function aggregateClicksByDay(rows: ClickRow[]) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const event = (row.meta as any)?.event || 'click'
    if (event !== 'click') continue
    const day = normalizeDay(row.created_at)
    if (!day) continue
    map.set(day, (map.get(day) || 0) + 1)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, count]) => ({ day, count }))
}

function normalizeDay(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getUTCFullYear()
  const month = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${d.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
