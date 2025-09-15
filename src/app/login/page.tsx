"use client"

import { signIn } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <section dir="rtl" className="main-container" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
        <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
        <p className="text-sm text-gray-600 mb-4">سجّل دخولك لمتابعة لوحة التحكم.</p>
        <div className="flex items-center gap-8">
          <button className="btn btn-primary" onClick={() => signIn('google', { callbackUrl: '/admin' })}>
            المتابعة عبر Google
          </button>
        </div>
      </div>
    </section>
  )
}

