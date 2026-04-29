const RESEND_BASE_URL = 'https://api.resend.com'
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

export type ResendSendEmailPayload = {
  from: string
  to: string
  subject: string
  html: string
}

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')
  return apiKey
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEmailWithRetry(payload: ResendSendEmailPayload, maxRetries = 3) {
  const apiKey = getResendApiKey()

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const raw = await response.text()
    const body = raw ? safeParse(raw) : null

    if (response.ok) return body

    const canRetry = RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries
    if (!canRetry) {
      const message = body?.message || body?.error || response.statusText || 'Resend request failed'
      throw new Error(`Resend send failed (${response.status}): ${message}`)
    }

    const backoffMs = Math.pow(2, attempt) * 450 + Math.floor(Math.random() * 120)
    await sleep(backoffMs)
  }

  throw new Error('Resend send failed after retries')
}

function safeParse(text: string) {
  try {
    return JSON.parse(text) as Record<string, string>
  } catch {
    return { message: text }
  }
}
