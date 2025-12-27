import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const campaignId = typeof body.campaignId === 'string' ? body.campaignId : null
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const previewText = typeof body.previewText === 'string' ? body.previewText.trim() : null
  const filters = body.filters || {}
  const scheduledAt = typeof body.scheduledAt === 'string' && body.scheduledAt ? body.scheduledAt : null

  if (!name || !templateId || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const payload = {
    name,
    created_by: session.user?.email || 'admin',
    filters_json: filters,
    template_id: templateId,
    subject,
    preview_text: previewText,
    scheduled_at: scheduledAt,
    status: 'draft',
  }

  if (campaignId) {
    const { error } = await supabase
      .from('bulk_email_campaigns')
      .update(payload)
      .eq('id', campaignId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: campaignId })
  }

  const { data, error } = await supabase
    .from('bulk_email_campaigns')
    .insert(payload)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data?.id })
}
