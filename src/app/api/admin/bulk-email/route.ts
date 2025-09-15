import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

function isAdmin(email?: string | null) {
  return email === 'meriembouzir05@gmail.com'
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.subject !== 'string' || typeof body.html !== 'string') {
    return NextResponse.json({ error: 'subject and html are required' }, { status: 400 })
  }

  const urlBase = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!urlBase || !serviceKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const endpoint = `${urlBase.replace(/\/$/, '')}/functions/v1/send-bulk-email`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text().catch(() => '')
  let data: unknown
  try { data = JSON.parse(text) } catch { data = { raw: text } as unknown }
  if (!res.ok) return NextResponse.json({ error: 'Function failed', status: res.status, data }, { status: 500 })
  return NextResponse.json(data)
}
