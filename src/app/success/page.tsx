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
          'radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,.08), rgba(255,255,255,0)), radial-gradient(700px 400px at 20% 100%, rgba(168,85,247,.08), rgba(255,255,255,0)), linear-gradient(180deg, rgba(255,255,255,.95), rgba(250,245,255,.92))',
        color: '#4c1d95',
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

