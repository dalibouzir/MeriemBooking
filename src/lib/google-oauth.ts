import { getSupabaseAdmin } from './supabaseAdmin'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const PROVIDER = 'google'

function defaultOwnerUserId(): string {
  const id = process.env.GOOGLE_OWNER_USER_ID
  if (!id) {
    throw new Error('Missing GOOGLE_OWNER_USER_ID in .env.local')
  }
  return id
}

export type GoogleTokenRow = {
  user_id: string
  provider: string
  access_token: string
  refresh_token: string
  expires_at: string
  scopes: string[]
}

export async function deleteGoogleTokens({ expiredOnly = false, userId }: { expiredOnly?: boolean; userId?: string } = {}) {
  const supabase = getSupabaseAdmin()
  const uid = userId || defaultOwnerUserId()
  const q = supabase.from('oauth_tokens').delete().eq('user_id', uid).eq('provider', PROVIDER)
  if (expiredOnly) {
    q.lt('expires_at', new Date().toISOString())
  }
  const { error } = await q
  if (error) throw new Error(`Failed to delete tokens: ${error.message}`)
}

export async function getGoogleTokens(userId?: string): Promise<GoogleTokenRow | null> {
  const supabase = getSupabaseAdmin()
  const uid = userId || defaultOwnerUserId()
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('user_id, provider, access_token, refresh_token, expires_at, scopes')
    .eq('user_id', uid)
    .eq('provider', PROVIDER)
    .maybeSingle()
  if (error) throw new Error(`Failed to fetch tokens: ${error.message}`)
  return (data as GoogleTokenRow | null) ?? null
}

export async function saveGoogleTokens(params: {
  access_token: string
  refresh_token: string
  expires_in: number
  scopes: string[]
  userId?: string
  id_token?: string
}) {
  const supabase = getSupabaseAdmin()
  const uid = params.userId || defaultOwnerUserId()
  // 60s skew for safety
  const expires_at = new Date(Date.now() + Math.max(0, params.expires_in - 60) * 1000).toISOString()

  // Ensure clean single row
  await deleteGoogleTokens({ expiredOnly: false, userId: uid })

  // Try insert with optional id_token if the column exists; if it fails, retry without it
  let { error } = await supabase.from('oauth_tokens').insert({
    user_id: uid,
    provider: PROVIDER,
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    expires_at,
    scopes: params.scopes,
    ...(params.id_token ? { id_token: params.id_token } : {}),
  } as any)
  if (error) {
    // Retry without id_token in case column doesn't exist
    const retry = await supabase.from('oauth_tokens').insert({
      user_id: uid,
      provider: PROVIDER,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      expires_at,
      scopes: params.scopes,
    })
    if (retry.error) throw new Error(`Failed to save tokens: ${retry.error.message}`)
  }
}

export async function updateAccessToken(access_token: string, expires_in: number, userId?: string) {
  const supabase = getSupabaseAdmin()
  const uid = userId || defaultOwnerUserId()
  const expires_at = new Date(Date.now() + Math.max(0, expires_in - 60) * 1000).toISOString()
  const { error } = await supabase
    .from('oauth_tokens')
    .update({ access_token, expires_at, updated_at: new Date().toISOString() })
    .eq('user_id', uid)
    .eq('provider', PROVIDER)
  if (error) throw new Error(`Failed to update tokens: ${error.message}`)
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`google_token_exchange_failed: ${text}`)
  }
  const json = JSON.parse(text) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
    token_type: string
  }
  return json
}

export async function refreshAccessTokenOrThrow(userId?: string): Promise<string> {
  const row = await getGoogleTokens(userId)
  if (!row) throw new Error('google_reconnect_required')
  if (!row.refresh_token) throw new Error('google_reconnect_required')
  const now = new Date()
  if (row.expires_at && new Date(row.expires_at) > now) {
    return row.access_token
  }

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
  }).toString()
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) {
    // If invalid_grant, delete row and force reconnect
    if (/invalid_grant/.test(text)) {
      await deleteGoogleTokens()
      throw new Error('google_reconnect_required')
    }
    throw new Error(`google_refresh_failed: ${text}`)
  }
  const j = JSON.parse(text) as { access_token: string; expires_in: number }
  await updateAccessToken(j.access_token, j.expires_in, userId)
  return j.access_token
}

export function buildGoogleAuthUrl(redirectUri: string, scopes: string[]) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: scopes.join(' '),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function getValidGoogleAccessToken(userId?: string) {
  return refreshAccessTokenOrThrow(userId)
}

export async function ensureAccessToken(userId?: string) {
  return refreshAccessTokenOrThrow(userId)
}
