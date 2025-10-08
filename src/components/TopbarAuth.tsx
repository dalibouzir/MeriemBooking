"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

type TopbarAuthProps = {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}

export default function TopbarAuth({ variant = 'desktop', onNavigate }: TopbarAuthProps) {
  const { data: session, status } = useSession()
  const email = session?.user?.email || ''
  const isAdmin = email === 'meriembouzir05@gmail.com'

  const containerClass = variant === 'mobile' ? 'auth-actions auth-actions--mobile' : 'auth-actions'
  const buttonClass = variant === 'mobile' ? 'btn btn-nav btn-mobile' : 'btn btn-nav'

  const handleNavigate = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <div className={containerClass}>
      {isAdmin && (
        <Link
          href="/admin"
          className={`${buttonClass} btn-outline`}
          aria-label="لوحة التحكم"
          onClick={handleNavigate}
        >
          لوحة التحكم
        </Link>
      )}
      {status === 'authenticated' ? (
        <button
          className={`${buttonClass} btn-outline`}
          onClick={() => {
            handleNavigate()
            void signOut({ callbackUrl: '/' })
          }}
        >
          تسجيل الخروج
        </button>
      ) : (
        <Link
          href="/login"
          className={`${buttonClass} btn-primary`}
          aria-label="تسجيل الدخول"
          onClick={handleNavigate}
        >
          تسجيل الدخول
        </Link>
      )}
    </div>
  )
}
