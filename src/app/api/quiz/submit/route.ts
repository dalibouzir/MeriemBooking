import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmailWithRetry } from '@/lib/resend'
import { QUIZ_EMAIL_SUBJECT, renderQuizResultEmailHtml } from '@/lib/quiz/emailTemplate'

const payloadSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  resultType: z.string().trim().min(1),
  secondaryType: z.string().trim().min(1).nullable(),
  shadowType: z.string().trim().min(1),
})

function isMissingQuizTableError(message: string) {
  return (
    message.includes("Could not find the table 'public.quiz_contendors' in the schema cache")
    || message.includes('relation "public.quiz_contendors" does not exist')
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = payloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const { name, email, resultType, secondaryType, shadowType } = parsed.data
    const supabase = getSupabaseAdmin()

    const { error: insertError } = await supabase.from('quiz_contendors').insert({
      name,
      email,
      result_type: resultType,
      secondary_type: secondaryType,
      shadow_type: shadowType,
    })

    if (insertError && !isMissingQuizTableError(insertError.message)) {
      throw new Error(insertError.message)
    }

    const from = (process.env.RESEND_FROM_EMAIL || 'Fittrah Women <noreply@fittrah.com>').trim()

    await sendEmailWithRetry({
      from,
      to: email,
      subject: QUIZ_EMAIL_SUBJECT,
      html: renderQuizResultEmailHtml({
        name,
        resultType,
        secondaryType,
        shadowType,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
