import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
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
}
