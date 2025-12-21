/**
 * Meta Conversions API Route Handler
 * POST /api/meta/capi
 * 
 * Receives events from client and forwards to Meta Graph API
 * with proper hashing and deduplication
 */

import { NextRequest, NextResponse } from 'next/server'
import { hashEmailSync, hashPhoneSync } from '@/lib/meta/hash'

// Environment variables
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2652858771748544'
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const API_VERSION = 'v18.0'

// Rate limiting (simple in-memory)
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const rateLimitBucket = new Map<string, number[]>()

interface CAPIRequestBody {
  event_name: string
  event_id: string
  email?: string
  phone?: string
  event_source_url?: string
  custom_data?: Record<string, unknown>
  fbp?: string
  fbc?: string
  user_agent?: string
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  return ''
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const timestamps = rateLimitBucket.get(ip) || []
  const recent = timestamps.filter((ts) => ts > windowStart)
  
  if (recent.length >= RATE_LIMIT_MAX) {
    return false
  }
  
  recent.push(now)
  rateLimitBucket.set(ip, recent)
  return true
}

export async function POST(req: NextRequest) {
  try {
    // Check configuration
    if (!ACCESS_TOKEN) {
      console.error('[CAPI] META_CAPI_ACCESS_TOKEN not configured')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Rate limiting
    const clientIP = getClientIP(req)
    if (clientIP && !checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse request
    const body: CAPIRequestBody = await req.json()

    // Validate required fields
    if (!body.event_name || !body.event_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event_name, event_id' },
        { status: 400 }
      )
    }

    // Build user_data with hashed PII
    const userData: Record<string, unknown> = {}

    if (body.email) {
      userData.em = [hashEmailSync(body.email)]
    }

    if (body.phone) {
      userData.ph = [hashPhoneSync(body.phone)]
    }

    if (clientIP) {
      userData.client_ip_address = clientIP
    }

    if (body.user_agent) {
      userData.client_user_agent = body.user_agent
    }

    if (body.fbp) {
      userData.fbp = body.fbp
    }

    if (body.fbc) {
      userData.fbc = body.fbc
    }

    // Build event payload
    const eventPayload: Record<string, unknown> = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      action_source: 'website',
      user_data: userData,
    }

    if (body.event_source_url) {
      eventPayload.event_source_url = body.event_source_url
    }

    if (body.custom_data && Object.keys(body.custom_data).length > 0) {
      eventPayload.custom_data = body.custom_data
    }

    // Build request to Meta
    const metaPayload: Record<string, unknown> = {
      data: [eventPayload],
    }

    // Add test event code if configured (for testing in Events Manager)
    if (TEST_EVENT_CODE) {
      metaPayload.test_event_code = TEST_EVENT_CODE
    }

    // Send to Meta Graph API
    const metaURL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`

    const metaResponse = await fetch(metaURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    })

    const metaResult = await metaResponse.json()

    if (!metaResponse.ok) {
      console.error('[CAPI] Meta API error:', metaResult)
      return NextResponse.json(
        { success: false, error: 'Meta API error', details: metaResult },
        { status: 502 }
      )
    }

    // Success
    if (process.env.NODE_ENV === 'development') {
      console.log('[CAPI] Event sent successfully:', {
        event_name: body.event_name,
        event_id: body.event_id,
        events_received: metaResult.events_received,
      })
    }

    return NextResponse.json({
      success: true,
      events_received: metaResult.events_received,
    })
  } catch (error) {
    console.error('[CAPI] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
