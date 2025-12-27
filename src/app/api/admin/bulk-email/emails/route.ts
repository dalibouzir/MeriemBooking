import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminSession } from '@/lib/adminAuth'
import { bulkEmailConfig, buildUserSelectList } from '@/lib/bulkEmailConfig'
import { applyBulkEmailFilters, applyRecipientEligibilityFilters, isValidEmail, parseBulkEmailFilters, type BulkEmailFilters } from '@/lib/bulkEmailUtils'

export const dynamic = 'force-dynamic'

const RECIPIENT_PAGE_SIZE = Math.max(100, Number(process.env.BULK_EMAIL_RECIPIENT_PAGE_SIZE || 1000))
const MAX_RECIPIENTS = Math.max(1000, Number(process.env.BULK_EMAIL_MAX_RECIPIENTS || 50000))

export async function GET(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filters = parseBulkEmailFilters(req.nextUrl.searchParams)
  const supabase = getSupabaseAdmin()

  try {
    const { emails, invalidCount, totalEligible } = await collectEmails(supabase, filters)
    return NextResponse.json({
      emails,
      totalEligible,
      validCount: emails.length,
      invalidCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to collect emails'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function collectEmails(supabase: ReturnType<typeof getSupabaseAdmin>, filters: BulkEmailFilters) {
  const cols = bulkEmailConfig.columns
  const selectList = buildUserSelectList()
  const unique = new Map<string, string>()
  let invalidCount = 0
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
    for (const row of batch as Record<string, unknown>[]) {
      const email = cols.email ? String(row[cols.email] || '') : ''
      if (!email) continue
      const normalized = email.trim().toLowerCase()
      if (!normalized || unique.has(normalized)) continue
      if (!isValidEmail(email)) {
        invalidCount += 1
        continue
      }
      unique.set(normalized, email.trim())
    }

    if (batch.length < RECIPIENT_PAGE_SIZE) break

    offset += RECIPIENT_PAGE_SIZE
    if (offset >= MAX_RECIPIENTS) {
      throw new Error(`Recipient limit exceeded (${MAX_RECIPIENTS}). Narrow the filters and try again.`)
    }
  }

  return { emails: Array.from(unique.values()), invalidCount, totalEligible: unique.size + invalidCount }
}
