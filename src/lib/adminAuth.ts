import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export function isAdmin(email?: string | null) {
  const envEmail = (process.env.MERIEM_ADMIN_EMAIL || '').trim().toLowerCase()
  const allowed = envEmail || 'meriembouzir05@gmail.com'
  return (email || '').trim().toLowerCase() === allowed
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) return null
  return session
}
