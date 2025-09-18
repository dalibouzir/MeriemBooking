import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateToken(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

type RequestDownloadBody = {
  name?: string
  email: string
  product: string
  first_name?: string
  last_name?: string
  phone?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RequestDownloadBody>
    const {
      name,
      first_name,
      last_name,
      email,
      product,
      phone,
    } = body || {}

    const firstName = (first_name ?? '').trim()
    const lastName = (last_name ?? '').trim()
    const fallbackName = (name ?? '').trim()

    if (!email || !product || (!firstName && !fallbackName) || (!lastName && !fallbackName)) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const fullName = fallbackName || `${firstName} ${lastName}`.trim()

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.fittrahmoms.com').replace(/^https?:\/\//, 'https://').replace(/\/$/, '')

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 1) Resolve product type and build official site download page URL (not raw storage)
    let isVideo = false
    {
      const { data: prod } = await supabase
        .from('products')
        .select('type, slug')
        .eq('slug', product)
        .maybeSingle()
      if (prod?.type) isVideo = prod.type === 'فيديو'
    }
    const downloadUrl = `${SITE_URL}/download?product=${encodeURIComponent(product)}`

    // 2) Generate call token (30-day expiry)
    const token = generateToken(10)
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // 3) Save request + token
    const { error: e1 } = await supabase.from('download_requests').insert({
      name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      product_slug: product,
      phone,
    })
    if (e1) throw e1

    const { error: e2 } = await supabase.from('call_tokens').insert({
      email,
      code: token,
      product_slug: product,
      expires_at,
      is_used: false,
    })
    if (e2) throw e2

    // 4) Redeem URL
    const redeemUrl = `${SITE_URL}/free-call/redeem?token=${token}`

    // 5) Trigger Edge Function to send email
    const fnUrl = `${SUPABASE_URL}/functions/v1/send-gift-email`
    const resFn = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: fullName, email, product, downloadUrl, redeemUrl, token, isVideo }),
    })

    if (!resFn.ok) {
      const txt = await resFn.text()
      throw new Error(`Send email failed: ${txt}`)
    }

    return NextResponse.json({ ok: true, token, redeemUrl, downloadUrl })
  } catch (err: unknown) {
    const error = err as Error
    console.error(error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
