import { NextResponse } from 'next/server'

export async function GET() {
  const email = process.env.MERIEM_ADMIN_EMAIL || ''
  const hasPass = !!process.env.MERIEM_ADMIN_PASSWORD
  const secretSet = !!process.env.NEXTAUTH_SECRET
  const urlSet = !!process.env.NEXTAUTH_URL
  return NextResponse.json({
    adminEmailPrefix: email ? email.slice(0, 5) : 'missing',
    hasAdminPassword: hasPass,
    hasNextAuthSecret: secretSet,
    hasNextAuthUrl: urlSet,
  })
}

