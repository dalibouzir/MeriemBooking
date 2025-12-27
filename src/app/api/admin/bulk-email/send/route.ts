import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'
import { bulkEmailConfig, buildUserSelectList } from '@/lib/bulkEmailConfig'
import {
  applyBulkEmailFilters,
  applyRecipientEligibilityFilters,
  chunkArray,
  isValidEmail,
  sleep,
  type BulkEmailFilters,
} from '@/lib/bulkEmailUtils'
import {
  addContactsToSegment,
  createBroadcast,
  createSegment,
  scheduleBroadcast,
  sendBroadcast,
  upsertContact,
} from '@/lib/resendAdapter'

export const dynamic = 'force-dynamic'

const CONTACT_BATCH_SIZE = Math.max(1, Number(process.env.BULK_EMAIL_CONTACT_BATCH_SIZE || 100))
const CONTACT_BATCH_DELAY = Math.max(0, Number(process.env.BULK_EMAIL_CONTACT_BATCH_DELAY_MS || 250))
const SEGMENT_BATCH_SIZE = Math.max(1, Number(process.env.BULK_EMAIL_SEGMENT_BATCH_SIZE || 200))
const RECIPIENT_PAGE_SIZE = Math.max(100, Number(process.env.BULK_EMAIL_RECIPIENT_PAGE_SIZE || 1000))
const MAX_RECIPIENTS = Math.max(1000, Number(process.env.BULK_EMAIL_MAX_RECIPIENTS || 50000))

export async function POST(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const campaignId = typeof body.campaignId === 'string' ? body.campaignId : null
  if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })

  const campaignIdStr = campaignId as string

  const supabase = getSupabaseAdmin()

  const { data: campaign, error: campaignError } = await supabase
    .from('bulk_email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: campaignError?.message || 'Campaign not found' }, { status: 404 })
  }

  if (campaign.status === 'sent') {
    return NextResponse.json({ error: 'Campaign already sent' }, { status: 409 })
  }

  if (!campaign.subject || !campaign.template_id) {
    return NextResponse.json({ error: 'Campaign is missing subject or template' }, { status: 400 })
  }

  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'noreply@fittrahmoms.com').trim()
  const replyTo = (process.env.RESEND_REPLY_TO || 'hello@fittrahmoms.com').trim()

  const scheduledAt = resolveScheduleTime(body.scheduledAt, campaign.scheduled_at)
  const shouldSchedule = Boolean(scheduledAt)

  const scheduledAtStr = scheduledAt as string

  const counts: Record<string, unknown> = {}

  try {
    await supabase
      .from('bulk_email_campaigns')
      .update({ status: 'queued', error_json: null })
      .eq('id', campaignId)

    const filters = normalizeFilters(campaign.filters_json)
    const recipients = await fetchEligibleRecipients(supabase, filters)
    counts.eligible = recipients.totalEligible
    counts.invalid = recipients.invalid.length
    counts.valid = recipients.valid.length
    counts.skipped = recipients.invalid.length

    if (!recipients.valid.length) {
      throw new Error('No valid recipients found')
    }

    const segmentId = campaign.segment_id || await resolveSegmentId(campaignId, campaign.name)
    if (!campaign.segment_id) {
      await supabase.from('bulk_email_campaigns').update({ segment_id: segmentId }).eq('id', campaignId)
    }

    const upserted = await upsertContactsInBatches(campaignIdStr, recipients.valid)
    counts.synced = upserted.results.length
    counts.sync_failed = upserted.failures.length

    await attachContactsToSegment(segmentId, upserted.results, campaignIdStr)

    const broadcastId = campaign.broadcast_id || await ensureBroadcast({
      campaignId: campaignIdStr,
      segmentId,
      subject: campaign.subject,
      previewText: campaign.preview_text || undefined,
      templateId: campaign.template_id,
      from: fromEmail,
      replyTo,
    })

    if (!campaign.broadcast_id) {
      await supabase.from('bulk_email_campaigns').update({ broadcast_id: broadcastId }).eq('id', campaignIdStr)
    }

    if (shouldSchedule) {
      await scheduleBroadcast(broadcastId, scheduledAtStr, `${campaignIdStr}-schedule`)
    } else {
      await sendBroadcast(broadcastId, `${campaignIdStr}-send`)
    }

    await writeRecipientAudit(supabase, campaignId, recipients, upserted.results, upserted.failures)

    await supabase
      .from('bulk_email_campaigns')
      .update({
        status: shouldSchedule ? 'queued' : 'sent',
        counts_json: counts,
        scheduled_at: scheduledAt,
        sent_at: shouldSchedule ? null : new Date().toISOString(),
        error_json: null,
      })
      .eq('id', campaignId)

    return NextResponse.json({
      ok: true,
      campaignId,
      segmentId,
      broadcastId,
      status: shouldSchedule ? 'queued' : 'sent',
      counts,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send campaign'

    await supabase
      .from('bulk_email_campaigns')
      .update({
        status: 'failed',
        counts_json: counts,
        error_json: { message },
      })
      .eq('id', campaignId)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function resolveScheduleTime(bodyValue: unknown, campaignValue: unknown) {
  const raw = typeof bodyValue === 'string' && bodyValue ? bodyValue : (typeof campaignValue === 'string' ? campaignValue : null)
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  const now = Date.now()
  if (date.getTime() <= now) return null
  return date.toISOString()
}

async function fetchEligibleRecipients(supabase: ReturnType<typeof getSupabaseAdmin>, filters: BulkEmailFilters) {
  const cols = bulkEmailConfig.columns
  const selectList = buildUserSelectList()
  const records = new Map<string, { id: string | null; email: string; firstName?: string; lastName?: string }>()

  let offset = 0
  while (true) {
    let query = supabase
      .from(bulkEmailConfig.userTable)
      .select(selectList)

    query = applyRecipientEligibilityFilters(query)
    query = applyBulkEmailFilters(query, filters)

    if (cols.createdAt) query = query.order(cols.createdAt, { ascending: false })

    const { data, error } = await query.range(offset, offset + RECIPIENT_PAGE_SIZE - 1)
    if (error) throw error

    const batch = data || []
    for (const row of (batch as unknown as Record<string, unknown>[])) {
      const email = cols.email ? String(row[cols.email] || '') : ''
      if (!email) continue
      const key = email.trim().toLowerCase()
      if (records.has(key)) continue

      const rawId = cols.id ? row[cols.id] : null
      records.set(key, {
        id: rawId ? String(rawId) : null,
        email: email.trim(),
        firstName: cols.firstName ? String(row[cols.firstName] || '') : undefined,
        lastName: cols.lastName ? String(row[cols.lastName] || '') : undefined,
      })
    }

    if (batch.length < RECIPIENT_PAGE_SIZE) break

    offset += RECIPIENT_PAGE_SIZE
    if (offset >= MAX_RECIPIENTS) {
      throw new Error(`Recipient limit exceeded (${MAX_RECIPIENTS}). Narrow the filters and try again.`)
    }
  }

  const all = Array.from(records.values())
  const valid: typeof all = []
  const invalid: typeof all = []

  for (const recipient of all) {
    if (isValidEmail(recipient.email)) valid.push(recipient)
    else invalid.push(recipient)
  }

  return {
    totalEligible: all.length,
    valid,
    invalid,
  }
}

async function ensureSegment(campaignId: string, name: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/[:.]/g, '-')
  const segmentName = `${name} - ${timestamp}`
  const segment = await createSegment(segmentName, `${campaignId}-segment`)
  return segment.id
}

async function resolveSegmentId(campaignId: string, name: string) {
  const sharedId = (process.env.RESEND_SEGMENT_ID || '').trim()
  if (sharedId) return sharedId
  return ensureSegment(campaignId, name)
}

async function ensureBroadcast(input: {
  campaignId: string
  segmentId: string
  subject: string
  previewText?: string
  templateId: string
  from: string
  replyTo?: string
}) {
  const broadcast = await createBroadcast({
    segmentId: input.segmentId,
    subject: input.subject,
    previewText: input.previewText,
    from: input.from,
    replyTo: input.replyTo,
    templateId: input.templateId,
  }, `${input.campaignId}-broadcast`)
  return broadcast.id
}

async function upsertContactsInBatches(campaignId: string, recipients: { email: string; firstName?: string; lastName?: string }[]) {
  const contacts = recipients.map((recipient) => ({
    email: recipient.email.trim(),
    first_name: recipient.firstName || undefined,
    last_name: recipient.lastName || undefined,
  })).filter((contact) => isValidEmail(contact.email))

  const batches = chunkArray(contacts, CONTACT_BATCH_SIZE)
  const results: { id?: string; email: string }[] = []
  const failures: { email: string; error: string }[] = []

  if (!contacts.length) {
    return { results, failures: [{ email: 'unknown', error: 'No valid email addresses to sync' }] }
  }

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]
    const settled = await Promise.allSettled(
      batch.map((contact) =>
        upsertContact(contact, `${campaignId}-contact-${contact.email}`)
      )
    )

    settled.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        const email = batch[idx]?.email || 'unknown'
        failures.push({ email, error: result.reason instanceof Error ? result.reason.message : 'Upsert failed' })
      }
    })

    if (CONTACT_BATCH_DELAY > 0 && index < batches.length - 1) {
      await sleep(CONTACT_BATCH_DELAY)
    }
  }

  return { results, failures }
}

async function attachContactsToSegment(segmentId: string, contacts: { id?: string; email: string }[], campaignId: string) {
  const emails = contacts.map((contact) => contact.email).filter(Boolean)
  const emailBatches = chunkArray(emails, SEGMENT_BATCH_SIZE)
  for (let i = 0; i < emailBatches.length; i += 1) {
    await addContactsToSegment(segmentId, { emails: emailBatches[i] }, `${campaignId}-segment-emails-${i}`)
  }
}

async function writeRecipientAudit(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  campaignId: string,
  recipients: { valid: { id: string | null; email: string }[]; invalid: { id: string | null; email: string }[] },
  synced: { id?: string; email: string }[],
  failures: { email: string; error: string }[]
) {
  const rows: { campaign_id: string; user_id: string | null; email: string; status: string }[] = []

  const userMap = new Map(recipients.valid.map((recipient) => [recipient.email.toLowerCase(), recipient.id]))

  for (const recipient of synced) {
    rows.push({
      campaign_id: campaignId,
      user_id: userMap.get(recipient.email.toLowerCase()) || null,
      email: recipient.email,
      status: 'synced',
    })
  }

  for (const recipient of recipients.invalid) {
    rows.push({
      campaign_id: campaignId,
      user_id: recipient.id,
      email: recipient.email,
      status: 'invalid',
    })
  }

  for (const failure of failures) {
    rows.push({
      campaign_id: campaignId,
      user_id: userMap.get(failure.email.toLowerCase()) || null,
      email: failure.email,
      status: 'skipped',
    })
  }

  if (!rows.length) return

  const batches = chunkArray(rows, 500)
  for (const batch of batches) {
    const { error } = await supabase.from('bulk_email_recipients').insert(batch)
    if (error) {
      console.warn('bulk email recipients insert failed', error.message)
      break
    }
  }
}

function normalizeFilters(raw: unknown): BulkEmailFilters {
  const value = (raw && typeof raw === 'object') ? (raw as Partial<BulkEmailFilters>) : {}
  return {
    status: Array.isArray(value.status) ? value.status : [],
    tags: Array.isArray(value.tags) ? value.tags : [],
    countries: Array.isArray(value.countries) ? value.countries : [],
    from: typeof value.from === 'string' ? value.from : null,
    to: typeof value.to === 'string' ? value.to : null,
    search: typeof value.search === 'string' ? value.search : null,
  }
}
