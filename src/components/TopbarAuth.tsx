"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function TopbarAuth() {
  const { data: session, status } = useSession()
  const email = session?.user?.email || ''
  const isAdmin = email === 'meriembouzir05@gmail.com'

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link href="/admin" className="btn btn-outline">لوحة التحكم</Link>
      )}
      {status === 'authenticated' ? (
        <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>تسجيل الخروج</button>
      ) : (
        <Link href="/login" className="btn">تسجيل الدخول</Link>
      )}
    </div>
  )
}
