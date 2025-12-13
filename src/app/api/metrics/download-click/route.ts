import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type Body = {
  clickId?: string
  product?: string
  source?: string
  referrer?: string
  event?: 'click' | 'submit'
  meta?: Record<string, unknown>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const clickId = (body.clickId || '').trim()
    if (!clickId) return NextResponse.json({ error: 'missing clickId' }, { status: 400 })

    const product = (body.product || '').trim() || 'unknown'
    const source = (body.source || '').trim() || 'unknown'
    const referrer = (body.referrer || '').trim() || ''
    const event = body.event === 'submit' ? 'submit' : 'click'

    const userAgent = req.headers.get('user-agent') || ''

    const supabase = getSupabaseAdmin()
    const submittedAt = event === 'submit' ? new Date().toISOString() : null
    const meta: Record<string, unknown> = {
      ...(body.meta || {}),
      event,
      ...(submittedAt ? { submitted_at: submittedAt } : {}),
    }

    const { error } = await supabase
      .from('download_clicks')
      .upsert(
        {
          click_id: clickId,
          product_slug: product,
          source,
          referrer,
          user_agent: userAgent,
          meta,
        } as any,
        { onConflict: 'click_id' }
      )
      .select('click_id')
      .single()

    if (error) {
      console.error('download-click upsert error', error)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const error = err as Error
    console.error(error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
