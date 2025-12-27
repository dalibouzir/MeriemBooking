export type BulkEmailTagsMode = 'array' | 'text'

type BulkEmailColumns = {
  id: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  marketingOptIn: string | null
  unsubscribed: string | null
  createdAt: string | null
  status: string | null
  tags: string | null
  country: string | null
}

export type BulkEmailConfig = {
  userTable: string
  tagsMode: BulkEmailTagsMode
  columns: BulkEmailColumns
}

function resolveColumn(value: string | undefined, fallback: string): string | null {
  const trimmed = (value ?? fallback).trim()
  const lowered = trimmed.toLowerCase()
  if (lowered === 'none' || lowered === 'null' || lowered === '-') return null
  return trimmed.length ? trimmed : null
}

function resolveTagsMode(value: string | undefined): BulkEmailTagsMode {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'text') return 'text'
  return 'array'
}

export const bulkEmailConfig: BulkEmailConfig = {
  userTable: (process.env.BULK_EMAIL_USER_TABLE || 'download_requests').trim(),
  tagsMode: resolveTagsMode(process.env.BULK_EMAIL_TAGS_MODE),
  columns: {
    id: resolveColumn(process.env.BULK_EMAIL_USER_ID_COLUMN, 'id'),
    email: resolveColumn(process.env.BULK_EMAIL_USER_EMAIL_COLUMN, 'email'),
    firstName: resolveColumn(process.env.BULK_EMAIL_USER_FIRST_NAME_COLUMN, 'first_name'),
    lastName: resolveColumn(process.env.BULK_EMAIL_USER_LAST_NAME_COLUMN, 'last_name'),
    marketingOptIn: resolveColumn(process.env.BULK_EMAIL_USER_OPTIN_COLUMN, ''),
    unsubscribed: resolveColumn(process.env.BULK_EMAIL_USER_UNSUB_COLUMN, ''),
    createdAt: resolveColumn(process.env.BULK_EMAIL_USER_CREATED_AT_COLUMN, 'created_at'),
    status: resolveColumn(process.env.BULK_EMAIL_USER_STATUS_COLUMN, ''),
    tags: resolveColumn(process.env.BULK_EMAIL_USER_TAGS_COLUMN, ''),
    country: resolveColumn(process.env.BULK_EMAIL_USER_COUNTRY_COLUMN, 'country'),
  },
}

export function buildUserSelectList(config: BulkEmailConfig = bulkEmailConfig): string {
  const cols = config.columns
  return [
    cols.id,
    cols.email,
    cols.firstName,
    cols.lastName,
    cols.createdAt,
    cols.status,
    cols.tags,
    cols.country,
    cols.marketingOptIn,
    cols.unsubscribed,
  ]
    .filter((col): col is string => Boolean(col))
    .join(', ')
}

export function normalizeTagsValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}
