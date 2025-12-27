const RESEND_API_BASE = 'https://api.resend.com'

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504])
const DEFAULT_RETRY_COUNT = 3
const DEFAULT_RETRY_BASE_MS = 500

export type ResendContactInput = {
  email: string
  first_name?: string
  last_name?: string
}

export type ResendContactResult = {
  id?: string
  email: string
}

export type ResendSegment = {
  id: string
  name: string
}

export type ResendBroadcast = {
  id: string
}

type ResendRequestOptions = {
  method?: string
  body?: Record<string, unknown>
  idempotencyKey?: string
}

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY')
  return key
}

function buildHeaders(idempotencyKey?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getResendApiKey()}`,
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  return headers
}

// API field names + endpoints centralized here. Update if Resend changes.
async function resendRequest<T>(path: string, options: ResendRequestOptions = {}): Promise<T> {
  const url = `${RESEND_API_BASE}${path}`
  const method = options.method || 'GET'
  const body = options.body ? JSON.stringify(options.body) : undefined
  const headers = buildHeaders(options.idempotencyKey)

  for (let attempt = 0; attempt <= DEFAULT_RETRY_COUNT; attempt += 1) {
    const res = await fetch(url, { method, headers, body })
    const text = await res.text()
    const payload = text ? safeJsonParse(text) : null

    if (res.ok) return payload as T

    const shouldRetry = RETRY_STATUSES.has(res.status) && attempt < DEFAULT_RETRY_COUNT
    if (!shouldRetry) {
      const message = payload?.message || payload?.error || res.statusText || 'Resend request failed'
      throw new Error(`[Resend ${method} ${path}] ${message} (status ${res.status})`)
    }

    const backoff = DEFAULT_RETRY_BASE_MS * Math.pow(2, attempt)
    const jitter = Math.floor(Math.random() * 100)
    await new Promise((resolve) => setTimeout(resolve, backoff + jitter))
  }

  throw new Error('Resend request failed after retries')
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export async function upsertContact(contact: ResendContactInput, idempotencyKey?: string): Promise<ResendContactResult> {
  try {
    const payload = await resendRequest<{ id?: string; email?: string }>(
      '/contacts',
      {
        method: 'POST',
        body: {
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
        },
        idempotencyKey,
      }
    )

    return {
      id: payload?.id,
      email: payload?.email || contact.email,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('status 409')) {
      return { email: contact.email }
    }
    throw error
  }
}

export async function createSegment(name: string, idempotencyKey?: string): Promise<ResendSegment> {
  const payload = await resendRequest<{ id: string; name: string }>(
    '/segments',
    {
      method: 'POST',
      body: { name },
      idempotencyKey,
    }
  )
  return payload
}

export async function addContactsToSegment(segmentId: string, contacts: { ids?: string[]; emails?: string[] }, idempotencyKey?: string) {
  const emails = contacts.emails || []
  if (!emails.length) return

  try {
    await resendRequest(`/segments/${segmentId}/contacts`, {
      method: 'POST',
      body: { emails },
      idempotencyKey,
    })
    return
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Missing `email` field')) {
      throw error
    }
  }

  for (const email of emails) {
    await resendRequest(`/segments/${segmentId}/contacts`, {
      method: 'POST',
      body: { email },
      idempotencyKey: idempotencyKey ? `${idempotencyKey}-${email}` : undefined,
    })
  }
}

export async function createBroadcast(input: {
  segmentId: string
  subject: string
  previewText?: string
  from: string
  replyTo?: string
  templateId: string
}, idempotencyKey?: string): Promise<ResendBroadcast> {
  const template = await resendRequest<{ id: string; html?: string; text?: string }>(
    `/templates/${input.templateId}`,
    { method: 'GET' }
  )
  const html = template?.html?.trim()
  const text = template?.text?.trim()
  if (!html && !text) {
    throw new Error('Template is missing html/text content')
  }

  const payload = await resendRequest<{ id: string }>(
    '/broadcasts',
    {
      method: 'POST',
      body: {
        name: `Bulk email ${new Date().toISOString()}`,
        segment_id: input.segmentId,
        subject: input.subject,
        preview_text: input.previewText,
        from: input.from,
        reply_to: input.replyTo,
        html,
        text,
      },
      idempotencyKey,
    }
  )
  return payload
}

export async function sendBroadcast(broadcastId: string, idempotencyKey?: string) {
  await resendRequest(`/broadcasts/${broadcastId}/send`, {
    method: 'POST',
    body: {},
    idempotencyKey,
  })
}

export async function scheduleBroadcast(broadcastId: string, sendAt: string, idempotencyKey?: string) {
  await resendRequest(`/broadcasts/${broadcastId}/schedule`, {
    method: 'POST',
    body: { send_at: sendAt },
    idempotencyKey,
  })
}
