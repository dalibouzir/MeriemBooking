import { Suspense } from 'react'
import SuccessClient from './SuccessClient'

function SuccessFallback() {
  return (
    <main
      aria-busy="true"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background:
          'radial-gradient(900px 500px at 80% -10%, hsl(var(--accent) / 0.12), transparent), radial-gradient(700px 400px at 20% 100%, hsl(var(--secondary) / 0.12), transparent), linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--bg)) 55%, hsl(var(--surface-muted)) 100%)',
        color: 'hsl(var(--text))',
        fontFamily: "'Tajawal', system-ui, -apple-system, Segoe UI, sans-serif",
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>جارٍ تجهيز صفحتك…</p>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessClient />
    </Suspense>
  )
}
