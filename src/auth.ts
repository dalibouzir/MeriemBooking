import type { NextAuthOptions, Account } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { saveGoogleTokens } from '@/lib/google-oauth'

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Keep scopes stable to ensure refresh compatibility
          scope: 'openid email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
      },
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const allowedEmail = process.env.MERIEM_ADMIN_EMAIL?.toLowerCase().trim()
        const allowedPassword = process.env.MERIEM_ADMIN_PASSWORD

        if (!credentials?.email || !credentials.password) return null
        if (!allowedEmail || !allowedPassword) return null

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        if (email === allowedEmail && password === allowedPassword) {
          return {
            id: 'meriembouzir',
            name: 'Meriem',
            email: allowedEmail,
          }
        }

        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) || session.user.email
        session.user.name = (token.name as string) || session.user.name
      }
      return session
    },
  },
  events: {
    async signIn({ account }) {
      if (account?.provider === 'google') {
        const expected = `${(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')}/api/auth/callback/google`
        console.log('[NextAuth][Google] OAuth callback hit. Expected redirect_uri:', expected)
        if (process.env.GOOGLE_REDIRECT_URI) {
          console.log('[NextAuth][Google] GOOGLE_REDIRECT_URI env:', process.env.GOOGLE_REDIRECT_URI)
        }
        const { access_token, refresh_token, expires_at, id_token, scope } = account as Account

        if (!refresh_token) {
          console.warn('[NextAuth][Google] Missing refresh_token on callback. Consent may not have included access_type=offline or prompt=consent.')
          return
        }
        if (!access_token || !expires_at) {
          console.warn('[NextAuth][Google] Missing access_token or expires_at; cannot persist tokens.')
          return
        }
        const expires_in = Math.max(0, Math.floor(expires_at - Date.now() / 1000))
        const scopes = (scope || '').split(' ').filter(Boolean)

        try {
          await saveGoogleTokens({ access_token, refresh_token, expires_in, scopes })
        } catch (e) {
          console.error('[NextAuth][Google] Failed to save tokens:', e)
        }
        if (id_token) {
          try {
            const [, payload] = id_token.split('.')
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
            console.log('[NextAuth][Google] id_token.sub (Google user id):', decoded?.sub)
            if (!process.env.GOOGLE_OWNER_USER_ID) {
              console.warn('[NextAuth][Google] GOOGLE_OWNER_USER_ID is missing. Set it to your UUID owner id in .env.local.')
            }
          } catch {
            // ignore decode errors
          }
        }
      }
    },
  },
}
