"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: true, callbackUrl: '/admin' })
    // NextAuth will redirect; if not, show a generic error
    setLoading(false)
    if (!res || res.error) setError('بيانات الدخول غير صحيحة')
  }

  return (
    <section dir="rtl" className="main-container" style={{ padding: 24 }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
        <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
        <p className="text-sm text-gray-600 mb-4">ادخل البريد وكلمة المرور للوصول إلى لوحة التحكم.</p>
        <form onSubmit={onSubmit} className="modal-form">
          <label className="field">
            <span className="field-label">البريد الإلكتروني</span>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span className="field-label">كلمة المرور</span>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </label>
          {error && <p className="alert alert-danger" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'جارٍ…' : 'دخول'}</button>
        </form>
      </div>
    </section>
  )
}
