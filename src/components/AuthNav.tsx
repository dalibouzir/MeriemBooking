"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function AuthNav() {
  const { data: session, status } = useSession()

  if (status === 'loading') return null

  if (session?.user) {
    return (
      <button
        type="button"
        className="nav-link nav-login"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        خروج
      </button>
    )
  }

  return (
    <Link href="/دخول" className="nav-link nav-login">
      دخول
    </Link>
  )
}
