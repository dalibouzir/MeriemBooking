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
  country?: string
  source?: string
  click_id?: string
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
      country,
      source,
      click_id,
    } = body || {}

    const firstName = (first_name ?? '').trim()
    const lastName = (last_name ?? '').trim()
    const fallbackName = (name ?? '').trim()

    if (!email || !product || (!firstName && !fallbackName) || (!lastName && !fallbackName)) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    const fullName = fallbackName || `${firstName} ${lastName}`.trim()
    // Basic phone validation: expect format "+<code> <local>" and ensure local has digits only without '+'
    const phoneStr = (phone ?? '').trim()
    if (!phoneStr) {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    }
    // Allow: +216 51234567, +33 612345678 etc.
    const phoneMatch = phoneStr.match(/^\s*(\+\d{1,4})\s+(\d+)\s*$/)
    if (!phoneMatch) {
      return NextResponse.json({ error: 'يرجى إدخال رقم الهاتف فقط بدون رمز الدولة' }, { status: 400 })
    }
    const formattedPhone = `${phoneMatch[1]} ${phoneMatch[2]}`
    const countryName = (country ?? '').trim() || null
    const sourceName = (source ?? '').trim() || 'download-form'
    const clickId = (click_id ?? '').trim() || null
    const userAgent = req.headers.get('user-agent') || null

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!
    const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.fittrahmoms.com').replace(/^https?:\/\//, 'https://').replace(/\/$/, '')

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
    const supabaseBaseUrl = SUPABASE_URL.replace(/\/$/, '')
    const buildStorageUrl = (bucket: string, path: string) => {
      const normalized = path.replace(/^\/+/g, '')
      const encoded = normalized
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')
      return `${supabaseBaseUrl}/storage/v1/object/public/${bucket}/${encoded}`
    }

    // 1) Resolve product file link from library (fallback to legacy products table/page)
    let isVideo = false
    let downloadUrl: string | null = null

    const { data: libraryItem } = await supabase
      .from('library_items')
      .select('type, public_url, file_path')
      .eq('id', product)
      .maybeSingle()

    if (libraryItem) {
      isVideo = libraryItem.type === 'video'
      if (libraryItem.file_path) {
        downloadUrl = buildStorageUrl('library', libraryItem.file_path)
      } else if (libraryItem.public_url) {
        downloadUrl = libraryItem.public_url
      }
    } else {
      const { data: prod } = await supabase
        .from('products')
        .select('type, slug')
        .eq('slug', product)
        .maybeSingle()
      if (prod?.type) isVideo = prod.type === 'فيديو' || prod.type === 'video'

      if (prod?.slug) {
        const assetsPrefix = isVideo ? 'public/videos' : 'public/books'
        const { data: assetsFiles } = await supabase.storage
          .from('assets')
          .list(assetsPrefix, { limit: 20, search: prod.slug })

        const match = assetsFiles?.find((file) => file.name === prod.slug || file.name.startsWith(`${prod.slug}.`))

        if (match) {
          downloadUrl = buildStorageUrl('assets', `${assetsPrefix}/${match.name}`)
        }
      }
    }

    if (!downloadUrl) {
      downloadUrl = `${SITE_URL}/download?product=${encodeURIComponent(product)}`
    }

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
      phone: formattedPhone,
      country: countryName,
      source: sourceName,
      click_id: clickId,
      user_agent: userAgent,
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
