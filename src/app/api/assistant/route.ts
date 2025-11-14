import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `
أنت مساعد ذكاء اصطناعي يتحدث اللغة العربية بطلاقة.
حيِّ المستخدم دائماً في بداية كل رد بتحية لطيفة، ثم قدِّم إجابة واضحة ومفيدة ومكتوبة بأسلوب بسيط ومباشر.
استخدم العربية فقط، إلا إذا طلب المستخدم غير ذلك.
احرص على تنظيم الإجابات في فقرات قصيرة أو نقاط عند الحاجة.
`

const API_URL = 'https://api.openai.com/v1/chat/completions'

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY غير مُحدّد' }, { status: 500 })
  }

  let body: { messages?: { role: string; content: string }[] }
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'البيانات المرسلة غير صحيحة.' }, { status: 400 })
  }

  const conversation = Array.isArray(body.messages) ? body.messages : []
  if (!conversation.length) {
    return NextResponse.json({ error: 'يرجى إرسال رسالة واحدة على الأقل.' }, { status: 400 })
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation],
        temperature: 0.6,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'فشل الاتصال بالمساعد.' },
        { status: response.status },
      )
    }

    const message = data?.choices?.[0]?.message?.content?.trim()
    if (!message) {
      return NextResponse.json({ error: 'لم نتلقَّ إجابة من المساعد.' }, { status: 502 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'تعذّر الوصول إلى مزود الذكاء الاصطناعي.' }, { status: 500 })
  }
}
