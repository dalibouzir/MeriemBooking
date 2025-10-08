// deno-lint-ignore-file no-explicit-any
// If this is in Next.js app route (app/api/.../route.ts) you can keep it as-is.
// For pages/api, export a default handler(Request, Response) differently.

export const runtime = 'edge' // remove this line if you want Node runtime

type DenoEnv = { env: { get(name: string): string | undefined } }
const DENO: { env?: DenoEnv["env"]; serve?: (h: (req: Request) => Response | Promise<Response>) => void } =
  (globalThis as unknown as { Deno?: DenoEnv & { serve?: (h: (req: Request) => Response | Promise<Response>) => void } }).Deno ?? {}

const getEnv = (k: string): string | undefined => DENO.env?.get?.(k)

const RESEND_API_KEY = getEnv('RESEND_API_KEY')?.trim()
const ENV_FROM = getEnv('EMAIL_FROM')?.trim()
const FROM = ENV_FROM && ENV_FROM.length > 0 ? ENV_FROM : 'Meriem <noreply@fittrahmoms.com>'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      ...extraHeaders,
    },
  })

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

type Payload = {
  subject: string
  html: string
  onlyConfirmed?: boolean
  test?: boolean
  testEmail?: string
  limit?: number
}

async function fetchRecipients(authHeader: string | null, onlyConfirmed: boolean, limit: number): Promise<string[]> {
  const urlBase = getEnv('SUPABASE_URL') || ''
  const anonKey = getEnv('SUPABASE_ANON_KEY') || ''
  if (!urlBase || !anonKey) return []

  // Use REST endpoint to avoid bringing supabase-js
  const url = new URL(`${urlBase.replace(/\/$/, '')}/rest/v1/user_emails`)
  if (onlyConfirmed) url.searchParams.set('is_confirmed', 'eq.true')
  url.searchParams.set('select', 'email')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    headers: {
      'apikey': anonKey,
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    },
  })
  if (!res.ok) return []
  const rows = await res.json().catch(() => []) as { email: string }[]
  return rows.map((r) => r.email).filter((e) => /@/.test(e))
}

async function sendBatch(to: string[], subject: string, html: string) {
  const body = { from: FROM, to, subject, html }
  const r = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`Resend error ${r.status}: ${t}`)
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return json(null, 204)
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405)

  if (!RESEND_API_KEY) return json({ error: 'Missing RESEND_API_KEY' }, 500)
  const fromMatch = FROM.match(/<\s*([^>]+)\s*>/i)
  const fromEmail = (fromMatch ? fromMatch[1] : FROM).toLowerCase()
  if (!fromEmail.endsWith('@fittrahmoms.com')) {
    return json({ error: 'Invalid FROM domain; must be @fittrahmoms.com' }, 500)
  }

  let payload: Payload | null = null
  try { payload = await req.json() } catch {}
  if (!payload || typeof payload.subject !== 'string' || typeof payload.html !== 'string') {
    return json({ error: 'subject and html are required' }, 400)
  }

  const onlyConfirmed = !!payload.onlyConfirmed
  const test = !!payload.test
  const testEmail = (payload.testEmail || '').trim()
  const limit = Math.min(Math.max(Number(payload.limit || 5000), 1), 10000)

  // In test mode, send only to testEmail
  let recipients: string[] = []
  if (test) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) return json({ error: 'valid testEmail is required in test mode' }, 400)
    recipients = [testEmail]
  } else {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || null
    recipients = await fetchRecipients(auth, onlyConfirmed, limit)
  }

  let sent = 0
  let failed = 0
  const details: { to: string[]; ok: boolean; error?: string }[] = []
  const batches = chunk(recipients, 500)
  for (const to of batches) {
    try {
      await sendBatch(to, payload.subject, payload.html)
      sent += to.length
      details.push({ to, ok: true })
    } catch (e) {
      failed += to.length
      details.push({ to, ok: false, error: String(e) })
    }
  }

  return json({ sent, failed, details })
}

// ---- Environment bridging -----------------------------------------------
// If running on Deno, use Deno.serve. Otherwise, *do not* register a 'fetch' listener
// in the browser type system — Next/Vercel will call the default export.
const maybeServe = DENO?.serve
if (typeof maybeServe === 'function') {
  maybeServe(handler)
} else if (
  // Only register in worker-like runtimes that actually support FetchEvent.
  typeof (globalThis as any).addEventListener === 'function' &&
  typeof (globalThis as any).FetchEvent !== 'undefined'
) {
  // Cast to any to avoid WindowEventMap typing issues.
  ;(globalThis as any).addEventListener('fetch', (event: any) => {
    event.respondWith(handler(event.request))
  })
}

export default handler
