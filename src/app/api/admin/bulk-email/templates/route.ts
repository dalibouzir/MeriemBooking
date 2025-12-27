import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

type TemplateOption = { id: string; name: string }

export async function GET() {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = resolveTemplates()
  return NextResponse.json({ templates })
}

function resolveTemplates(): TemplateOption[] {
  const listEnv = (process.env.RESEND_TEMPLATE_LIST || '').trim()
  if (listEnv) {
    return listEnv
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [id, name] = entry.split(':').map((part) => part.trim())
        return { id, name: name || id }
      })
      .filter((template) => template.id)
  }

  const id = (process.env.RESEND_TEMPLATE_ID || '').trim()
  if (!id) return []

  return [
    {
      id,
      name: (process.env.RESEND_TEMPLATE_NAME || 'Default template').trim(),
    },
  ]
}
