import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { deleteGoogleTokens, exchangeCodeForTokens, saveGoogleTokens } from '@/lib/google-oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAdminEmail(email?: string | null) {
  return !!email && email === process.env.MERIEM_ADMIN_EMAIL
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const cookieState = (await (async () => {
    // NextResponse doesn't provide cookie reading; rely on headers
    // In Next.js Route Handlers, cookies() is available from next/headers, but to keep compatibility
    // we extract from request headers here minimally
    const cookie = req.headers.get('cookie') || ''
    const m = cookie.match(/(?:^|; )google_oauth_state=([^;]+)/)
    return m ? decodeURIComponent(m[1]) : null
  })())

  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!redirectUri) return NextResponse.json({ error: 'Missing GOOGLE_REDIRECT_URI' }, { status: 500 })

  try {
    const tokenJson = await exchangeCodeForTokens(code, redirectUri)
    const scopes = (tokenJson.scope || '').split(' ').filter(Boolean)
    if (!tokenJson.refresh_token) {
      // Force consent again to obtain refresh_token
      const res = NextResponse.redirect('/api/google/oauth/start')
      res.cookies.set('google_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 })
      return res
    }

    await saveGoogleTokens({
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expires_in: tokenJson.expires_in,
      scopes,
    })

    // Clear the state cookie
    const ok = NextResponse.json({ ok: true })
    ok.cookies.set('google_oauth_state', '', { httpOnly: true, path: '/', maxAge: 0 })
    return ok
  } catch (e: unknown) {
    // Clean any partial tokens
    try { await deleteGoogleTokens({ expiredOnly: false }) } catch {}
    const msg = e instanceof Error ? e.message : 'Token exchange failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
