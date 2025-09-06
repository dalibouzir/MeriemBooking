"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const params = useSearchParams()
  const error = params.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        // show inline error by updating the query string
        const url = new URL(window.location.href)
        url.searchParams.set('error', 'CredentialsSignin')
        window.history.replaceState({}, '', url.toString())
      } else {
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h1 className="page-title" style={{ marginBottom: 16 }}>تسجيل الدخول</h1>
      {error && (
        <p style={{ color: 'var(--red-600)', marginBottom: 12 }}>
          بيانات اعتماد غير صالحة. حاول مرة أخرى.
        </p>
      )}
      <form onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
        <label className="field">
          <span className="field-label">البريد الإلكتروني</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />
        </label>
        <label className="field" style={{ marginTop: 12 }}>
          <span className="field-label">كلمة المرور</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? 'جارٍ...' : 'دخول'}
        </button>
      </form>
    </div>
  )
}
