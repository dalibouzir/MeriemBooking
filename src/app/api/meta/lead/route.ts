import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

type LeadPayload = {
  event_id?: string
  event_source_url?: string
  email?: string
  phone?: string
  fbp?: string
  fbc?: string
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitBucket = new Map<string, number[]>()

const META_PIXEL_ID = process.env.META_PIXEL_ID
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v20.0'
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, '')
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function getClientIp(req: NextRequest) {
  const header = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  return header.split(',')[0]?.trim() || ''
}

function rateLimit(ip: string) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const timestamps = rateLimitBucket.get(ip) || []
  const recent = timestamps.filter((ts) => ts > windowStart)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitBucket.set(ip, recent)
  return true
}

export async function POST(req: NextRequest) {
  try {
    if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Meta configuration missing' }, { status: 500 })
    }

    const clientIp = getClientIp(req)
    if (!rateLimit(clientIp || 'unknown')) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = (await req.json()) as LeadPayload
    const eventId = (body.event_id || '').trim()
    const eventSourceUrl = (body.event_source_url || '').trim()
    const email = (body.email || '').trim()
    const phone = (body.phone || '').trim()
    const fbp = (body.fbp || '').trim()
    const fbc = (body.fbc || '').trim()

    if (!eventId || !eventSourceUrl || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || ''
    const payloadUserData: Record<string, unknown> = {
      em: [sha256(normalizeEmail(email))],
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone) {
      payloadUserData.ph = [sha256(normalizedPhone)]
    }
    if (fbp) payloadUserData.fbp = fbp
    if (fbc) payloadUserData.fbc = fbc

    const eventTime = Math.floor(Date.now() / 1000)
    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'website',
          event_source_url: eventSourceUrl,
          event_id: eventId,
          user_data: payloadUserData,
        },
      ],
    }

    if (META_TEST_EVENT_CODE) {
      payload.test_event_code = META_TEST_EVENT_CODE
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (res.ok) {
      console.log('Lead sent ok', res.status)
      return NextResponse.json({ ok: true })
    }

    console.error('Lead send failed', res.status)
    return NextResponse.json({ error: 'Meta Lead send failed' }, { status: 500 })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Lead send failed', error?.message || 'unknown')
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
