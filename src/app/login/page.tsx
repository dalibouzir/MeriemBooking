import { Suspense } from 'react'
import ArabicLoginPage from '../دخول/page'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ArabicLoginPage />
    </Suspense>
  )
}
