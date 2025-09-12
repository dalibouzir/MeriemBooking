import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { buildGoogleAuthUrl, deleteGoogleTokens } from '@/lib/google-oauth'

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
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!redirectUri) return NextResponse.json({ error: 'Missing GOOGLE_REDIRECT_URI' }, { status: 500 })

  // Clean any existing Google tokens first
  try {
    await deleteGoogleTokens({ expiredOnly: false })
  } catch (e) {
    // Log but proceed to auth
    console.warn('Failed to cleanup oauth_tokens before start:', e)
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
  ]
  const url = buildGoogleAuthUrl(redirectUri, scopes)

  // CSRF state cookie (random)
  const state = crypto.randomUUID()
  const u = new URL(url)
  u.searchParams.set('state', state)

  const res = NextResponse.redirect(u.toString())
  res.cookies.set('google_oauth_state', state, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 10 })
  return res
}
