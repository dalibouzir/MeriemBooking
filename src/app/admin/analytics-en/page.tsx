import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import AnalyticsEnClient from './AnalyticsEnClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsEnPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.email === 'meriembouzir05@gmail.com'
  if (!isAdmin) {
    return (
      <div lang="en" dir="ltr" className="main-container" style={{ padding: 24 }}>
        <h1 className="text-2xl font-semibold text-red-600">Unauthorized</h1>
        <p className="text-gray-600">You must be an admin to access this page.</p>
      </div>
    )
  }
  return <AnalyticsEnClient />
}
