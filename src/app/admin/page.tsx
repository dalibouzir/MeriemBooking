import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.email === 'meriembouzir05@gmail.com'
  if (!isAdmin) {
    return (
      <div dir="ltr" className="main-container" style={{ padding: 24 }}>
        <h1 className="text-2xl font-semibold text-red-600">Not allowed</h1>
        <p className="text-gray-600">You must be signed in as an admin to access the dashboard.</p>
      </div>
    )
  }
  return <AdminDashboard adminEmail={session!.user!.email!} />
}
