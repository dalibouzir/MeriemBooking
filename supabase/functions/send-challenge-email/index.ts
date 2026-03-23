// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: Send challenge registration confirmation email

type DenoEnv = { env: { get(name: string): string | undefined } }
const DENO: { env?: DenoEnv["env"]; serve?: (h: (req: Request) => Response | Promise<Response>) => void } =
  (globalThis as unknown as { Deno?: DenoEnv & { serve?: (h: (req: Request) => Response | Promise<Response>) => void } }).Deno ?? {}

const getEnv = (k: string): string | undefined => DENO.env?.get?.(k)

const RESEND_API_KEY = getEnv("RESEND_API_KEY")?.trim()
const ENV_FROM = getEnv("EMAIL_FROM")?.trim()
const FROM = ENV_FROM && ENV_FROM.length > 0 ? ENV_FROM : "Fittrah Women <noreply@fittrahmoms.com>"
const RESEND_ENDPOINT = "https://api.resend.com/emails"

// ------------ utils ------------
const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...extraHeaders,
    },
  })

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

const isValidUrl = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

// Format date in Arabic with Western numerals
const formatDateArabic = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-u-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// Format time in Arabic with Western numerals
const formatTimeArabic = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ar-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

const arabicPlainText = ({
  name,
  meetingUrl,
  startsAt,
  durationMinutes,
  registrationId,
}: {
  name?: string
  meetingUrl: string
  startsAt: string
  durationMinutes: number
  registrationId: string
}) => {
  const greet = name && name.trim().length > 0 ? name.trim() : "عزيزتي"
  const formattedDate = formatDateArabic(startsAt)
  const formattedTime = formatTimeArabic(startsAt)
  
  return [
    "العنوان: 🎉 تم تسجيلك في تحدي التوازن!",
    "",
    `مرحبًا ${greet}،`,
    "",
    "🎊 مبارك! تم تأكيد تسجيلك في تحدي التوازن بنجاح!",
    "",
    "📅 موعد اللقاء:",
    `التاريخ: ${formattedDate}`,
    `الوقت: ${formattedTime}`,
    `المدة: ${durationMinutes} دقيقة`,
    "",
    "🔗 رابط الانضمام للاجتماع:",
    meetingUrl,
    "",
    "⚠️ ملاحظات مهمة:",
    "• احرصي على الانضمام قبل الموعد بـ 5 دقائق",
    "• تأكدي من وجود اتصال جيد بالإنترنت",
    "• اختاري مكان هادئ للتركيز",
    "",
    `رقم التسجيل: ${registrationId}`,
    "",
    "أنتظركِ بشوق! 💜",
    "",
    "مع محبّتي،",
    "مريم بوزير",
    "",
    "— — —",
    "فطرة النساء · Fittrah Women",
  ].join("\n")
}

// ------------ handler ------------
type RequestPayload = {
  name?: string
  email?: string
  meetingUrl?: string
  startsAt?: string
  durationMinutes?: number
  registrationId?: string
  replyTo?: string
  meriemImgUrl?: string
}

type EdgeFetchEvent = {
  request: Request
  respondWith(response: Response | Promise<Response>): void
}

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return json(null, 204)

  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405)

  if (!RESEND_API_KEY) {
    return json({ error: "Missing RESEND_API_KEY (check Supabase secrets / redeploy)" }, 500)
  }

  // Safety: enforce From domain is your verified domain (fittrahmoms.com)
  const fromMatch = FROM.match(/<\s*([^>]+)\s*>/i)
  const fromEmail = (fromMatch ? fromMatch[1] : FROM).toLowerCase()
  if (!fromEmail.endsWith("@fittrahmoms.com")) {
    return json(
      {
        error: "Invalid FROM domain",
        details: "EMAIL_FROM must use your verified domain (e.g., Fittrah Women <noreply@fittrahmoms.com>).",
      },
      500,
    )
  }

  let payload: RequestPayload
  try {
    payload = (await req.json()) as RequestPayload
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { name, email, meetingUrl, startsAt, durationMinutes, registrationId, replyTo, meriemImgUrl } = payload ?? {}

  // Validation
  const errors: string[] = []
  if (!email || !isValidEmail(email)) errors.push("valid email is required")
  if (!meetingUrl || !isValidUrl(meetingUrl)) errors.push("valid meetingUrl is required")
  if (!startsAt) errors.push("startsAt is required")
  if (!durationMinutes || typeof durationMinutes !== "number") errors.push("durationMinutes is required")
  if (!registrationId) errors.push("registrationId is required")

  if (errors.length) return json({ error: "Validation failed", details: errors }, 400)

  const subject = "🎉 تم تسجيلك في تحدي التوازن!"
  const greet = typeof name === "string" && name.trim().length > 0 ? name.trim() : "عزيزتي"

  const ensuredEmail = email as string
  const ensuredMeetingUrl = meetingUrl as string
  const ensuredStartsAt = startsAt as string
  const ensuredDuration = durationMinutes as number
  const ensuredRegistrationId = registrationId as string

  const formattedDate = formatDateArabic(ensuredStartsAt)
  const formattedTime = formatTimeArabic(ensuredStartsAt)

  const MERIEM_IMG =
    typeof meriemImgUrl === "string" && isValidUrl(meriemImgUrl) && meriemImgUrl
      ? meriemImgUrl
      : "https://www.fittrahmoms.com/Meriem.jpeg"

  const btn = (
    href: string,
    label: string,
    colorA = "#7c3aed",
    colorB = "#a855f7",
    icon = "🔗",
  ) => `
    <a href="${href}" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(90deg, ${colorA}, ${colorB});color:#fff;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:800;font-size:15px;box-shadow:0 12px 24px rgba(124,58,237,.22)" target="_blank" rel="noopener noreferrer">
      ${icon ? `<span style="font-size:20px">${icon}</span>` : ""}
      <span>${label}</span>
    </a>
  `

  const html = `
  <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;background:linear-gradient(135deg,#f4f3ff,#fdf4ff);padding:34px 18px;color:#111111">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #e6defd;box-shadow:0 30px 60px rgba(88,63,199,0.16);overflow:hidden">
      
      <!-- Header -->
      <div style="padding:28px 30px;background:linear-gradient(140deg,#f6edff,#eef2ff);border-bottom:1px solid #e6defd;position:relative">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at top left, rgba(168,85,247,0.2), transparent 62%),radial-gradient(circle at bottom right, rgba(236,72,153,0.15), transparent 55%);"></div>
        <div style="position:relative;display:flex;align-items:center;gap:16px;margin-bottom:14px">
          <div style="width:68px;height:68px;border-radius:22px;overflow:hidden;box-shadow:0 20px 40px rgba(15,23,42,0.24);background:#ffffff;display:flex;align-items:center;justify-content:center">
            <img src="${MERIEM_IMG}" alt="مريم بوزير" style="width:100%;height:100%;object-fit:cover" />
          </div>
          <div style="display:grid;gap:4px;color:#2e1065">
            <span style="font-weight:800;font-size:20px">مريم بوزير</span>
            <span style="font-size:13px;color:#5b21b6">مدرّبة علاقات ومرافقة للأمهات</span>
          </div>
        </div>
      </div>

      <!-- Success Banner -->
      <div style="padding:24px 30px;background:linear-gradient(135deg,#dcfce7,#f0fdf4);border-bottom:1px solid #bbf7d0">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(34,197,94,0.3)">
            <span style="font-size:26px">✓</span>
          </div>
          <div>
            <h1 style="margin:0;font-size:22px;color:#166534;font-weight:800">🎉 تم تسجيلك بنجاح!</h1>
            <p style="margin:4px 0 0;font-size:14px;color:#15803d">مبارك! أنتِ الآن مسجّلة في تحدي التوازن</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div style="padding:28px 30px;display:grid;gap:20px;font-size:15px;line-height:1.9;color:#111111;background:#ffffff">
        <p style="margin:0;font-size:16px;color:#111111">مرحبًا <strong style="color:#7c3aed">${greet}</strong>،</p>

        <p style="margin:0">نحن سعداء جدًا بانضمامك! استعدّي لرحلة مميزة نحو التوازن والهدوء الداخلي.</p>

        <!-- Meeting Details Card -->
        <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#faf5ff,#fdf4ff);border:2px solid #e9d5ff;box-shadow:0 20px 40px rgba(168,85,247,0.12)">
          <h2 style="margin:0 0 18px;font-size:18px;color:#7c3aed;display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📅</span>
            <span>تفاصيل اللقاء</span>
          </h2>
          
          <div style="display:grid;gap:14px">
            <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#ffffff;border-radius:14px;border:1px solid #e9d5ff">
              <span style="font-size:24px;width:36px;text-align:center">📆</span>
              <div>
                <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px">التاريخ</div>
                <div style="font-size:16px;font-weight:700;color:#1f2937">${formattedDate}</div>
              </div>
            </div>
            
            <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#ffffff;border-radius:14px;border:1px solid #e9d5ff">
              <span style="font-size:24px;width:36px;text-align:center">⏰</span>
              <div>
                <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px">الوقت</div>
                <div style="font-size:16px;font-weight:700;color:#1f2937">${formattedTime} (${ensuredDuration} دقيقة)</div>
              </div>
            </div>
            
            <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#ffffff;border-radius:14px;border:1px solid #e9d5ff">
              <span style="font-size:24px;width:36px;text-align:center">🌐</span>
              <div>
                <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:2px">المنصة</div>
                <div style="font-size:16px;font-weight:700;color:#1f2937">Google Meet (أونلاين)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Meeting Link Box -->
        <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;box-shadow:0 20px 40px rgba(124,58,237,0.3)">
          <h3 style="margin:0 0 14px;font-size:17px;display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">🔗</span>
            <span>رابط الانضمام للاجتماع</span>
          </h3>
          <p style="margin:0 0 16px;font-size:14px;opacity:0.9">احفظي هذا الرابط واستخدميه للانضمام في الموعد المحدد</p>
          <div style="background:rgba(255,255,255,0.15);padding:14px 18px;border-radius:12px;margin-bottom:16px;word-break:break-all">
            <a href="${ensuredMeetingUrl}" style="color:#ffffff;text-decoration:none;font-size:14px;font-family:monospace">${ensuredMeetingUrl}</a>
          </div>
          <a href="${ensuredMeetingUrl}" style="display:inline-flex;align-items:center;gap:10px;background:#ffffff;color:#7c3aed;text-decoration:none;padding:14px 28px;border-radius:14px;font-weight:800;font-size:15px;box-shadow:0 8px 20px rgba(0,0,0,0.15)" target="_blank" rel="noopener noreferrer">
            <span style="font-size:20px">🚀</span>
            <span>افتحي رابط الاجتماع</span>
          </a>
        </div>

        <!-- Tips Card -->
        <div style="padding:22px;border-radius:18px;background:#fffbeb;border:1px solid #fde68a;display:grid;gap:12px">
          <h3 style="margin:0;font-size:16px;color:#92400e;display:flex;align-items:center;gap:8px">
            <span>⚠️</span>
            <span>ملاحظات مهمة للاجتماع</span>
          </h3>
          <ul style="margin:0;padding:0;list-style:none;display:grid;gap:10px;font-size:14px;color:#78350f">
            <li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>احرصي على الانضمام قبل الموعد بـ 5 دقائق</span></li>
            <li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>تأكدي من وجود اتصال جيد بالإنترنت</span></li>
            <li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>اختاري مكان هادئ للتركيز</span></li>
            <li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>جهّزي ورقة وقلم لتدوين الملاحظات</span></li>
          </ul>
        </div>

        <!-- Registration ID -->
        <div style="padding:16px 20px;border-radius:14px;background:#f1f5f9;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px">
          <span style="font-size:18px">🆔</span>
          <div>
            <span style="font-size:13px;color:#64748b">رقم التسجيل: </span>
            <code style="font-size:13px;color:#334155;background:#e2e8f0;padding:4px 8px;border-radius:6px">${ensuredRegistrationId}</code>
          </div>
        </div>

        <div style="padding:20px;border-radius:16px;border:1px dashed #d4d4d8;background:#fefce8;text-align:center">
          <p style="margin:0;font-size:15px;color:#713f12">💜 أنتظركِ بشوق في اللقاء!</p>
        </div>

        <p style="margin:0;font-size:15px;color:#111111">مع محبّتي،<br/><strong style="color:#7c3aed">مريم بوزير</strong></p>
      </div>

      <!-- Footer -->
      <div style="padding:18px 24px;background:linear-gradient(135deg,#ede9fe,#f7f5ff);border-top:1px solid #e6defd;text-align:center;color:#4c1d95;font-size:13px;font-weight:600">
        فطرة النساء · Fittrah Women
      </div>
    </div>
  </div>
  `.trim()

  const text = arabicPlainText({
    name,
    meetingUrl: ensuredMeetingUrl,
    startsAt: ensuredStartsAt,
    durationMinutes: ensuredDuration,
    registrationId: ensuredRegistrationId,
  })

  // Build body for Resend
  const body: Record<string, unknown> = {
    from: FROM,
    to: [ensuredEmail],
    subject,
    html,
    text,
  }
  if (replyTo && isValidEmail(replyTo)) body.reply_to = replyTo

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!r.ok) {
      const bodyText = await r.text().catch(() => "")
      return json(
        {
          error: "Resend error",
          status: r.status,
          hint:
            r.status === 403
              ? "Ensure this API key belongs to the Resend workspace where fittrahmoms.com is Verified."
              : undefined,
          body: bodyText,
        },
        502,
      )
    }

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: "Network error calling Resend", details: String(e) }, 502)
  }
}

// Deno.serve for Supabase Edge; fallback for Vercel
const maybeServe = DENO?.serve
if (typeof maybeServe === "function") {
  maybeServe(handler)
} else if (typeof addEventListener !== "undefined") {
  addEventListener("fetch", (event: unknown) => {
    const fetchEvent = event as EdgeFetchEvent
    fetchEvent.respondWith(handler(fetchEvent.request))
  })
}

export default handler
