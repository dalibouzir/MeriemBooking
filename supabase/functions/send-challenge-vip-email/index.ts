// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: Send VIP Day 3 confirmation email

type DenoEnv = { env: { get(name: string): string | undefined } }
const DENO: { env?: DenoEnv["env"]; serve?: (h: (req: Request) => Response | Promise<Response>) => void } =
  (globalThis as unknown as { Deno?: DenoEnv & { serve?: (h: (req: Request) => Response | Promise<Response>) => void } }).Deno ?? {}

const getEnv = (k: string): string | undefined => DENO.env?.get?.(k)

const RESEND_API_KEY = getEnv("RESEND_API_KEY")?.trim()
const ENV_FROM = getEnv("EMAIL_FROM")?.trim()
const FROM = ENV_FROM && ENV_FROM.length > 0 ? ENV_FROM : "Fittrah Women <noreply@fittrahmoms.com>"
const RESEND_ENDPOINT = "https://api.resend.com/emails"

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

const formatDateArabic = (dateStr?: string) => {
  if (!dateStr) return "سيتم إعلامك بالموعد"
  try {
    return new Date(dateStr).toLocaleDateString("ar-u-nu-latn", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

const formatTimeArabic = (dateStr?: string) => {
  if (!dateStr) return "سيتم إعلامك بالتوقيت"
  try {
    return new Date(dateStr).toLocaleTimeString("ar-u-nu-latn", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

type RequestPayload = {
  name?: string
  email?: string
  vipMeetingUrl?: string
  startsAt?: string
  durationMinutes?: number
  paymentSource?: string
  paymentNote?: string
  replyTo?: string
  meriemImgUrl?: string
}

type EdgeFetchEvent = {
  request: Request
  respondWith(response: Response | Promise<Response>): void
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null, 204)
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405)

  if (!RESEND_API_KEY) {
    return json({ error: "Missing RESEND_API_KEY (check Supabase secrets / redeploy)" }, 500)
  }

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

  const { name, email, vipMeetingUrl, startsAt, durationMinutes, paymentSource, paymentNote, replyTo, meriemImgUrl } = payload ?? {}

  const errors: string[] = []
  if (!email || !isValidEmail(email)) errors.push("valid email is required")
  if (!vipMeetingUrl || !isValidUrl(vipMeetingUrl)) errors.push("valid vipMeetingUrl is required")
  if (startsAt && Number.isNaN(new Date(startsAt).getTime())) errors.push("startsAt is invalid date")
  if (durationMinutes !== undefined && typeof durationMinutes !== "number") errors.push("durationMinutes must be a number")
  if (errors.length) return json({ error: "Validation failed", details: errors }, 400)

  const greet = typeof name === "string" && name.trim().length > 0 ? name.trim() : "عزيزتي"
  const formattedDate = formatDateArabic(startsAt)
  const formattedTime = formatTimeArabic(startsAt)
  const durationLabel = typeof durationMinutes === "number" ? `${durationMinutes} دقيقة` : "—"

  const MERIEM_IMG =
    typeof meriemImgUrl === "string" && isValidUrl(meriemImgUrl) && meriemImgUrl
      ? meriemImgUrl
      : "https://www.fittrahmoms.com/Meriem.jpeg"

  const btn = (href: string, label: string) => `
    <a href="${href}" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(90deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:800;font-size:15px;box-shadow:0 12px 24px rgba(124,58,237,.22)" target="_blank" rel="noopener noreferrer">
      <span style="font-size:20px">🔗</span>
      <span>${label}</span>
    </a>
  `

  const sourceLine = paymentSource ? `<li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>طريقة الدفع: ${paymentSource}</span></li>` : ""
  const noteLine = paymentNote ? `<li style="display:flex;align-items:flex-start;gap:10px"><span>•</span><span>ملاحظة: ${paymentNote}</span></li>` : ""

  const subject = "✨ تم تفعيل دخولك VIP لليوم الثالث"
  const text = [
    `مرحبًا ${greet}،`,
    "",
    "🎉 مبروك! تم تفعيل دخولك إلى جلسة اليوم الثالث VIP.",
    "",
    "📅 تفاصيل الجلسة:",
    `التاريخ: ${formattedDate}`,
    `الوقت: ${formattedTime}`,
    `المدة: ${durationLabel}`,
    "",
    "🔗 رابط Zoom الخاص بجلسة VIP:",
    vipMeetingUrl,
    paymentSource ? `طريقة الدفع: ${paymentSource}` : "",
    paymentNote ? `ملاحظة: ${paymentNote}` : "",
    "",
    "نراك قريبًا 💜",
    "مريم بوزير",
    "فطرة النساء · Fittrah Women",
  ].filter(Boolean).join("\n")

  const html = `
  <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;background:linear-gradient(135deg,#f4f3ff,#fdf4ff);padding:34px 18px;color:#111111">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #e6defd;box-shadow:0 30px 60px rgba(88,63,199,0.16);overflow:hidden">
      <div style="padding:28px 30px;background:linear-gradient(140deg,#f6edff,#eef2ff);border-bottom:1px solid #e6defd;position:relative">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at top left, rgba(168,85,247,0.2), transparent 62%),radial-gradient(circle at bottom right, rgba(236,72,153,0.15), transparent 55%);"></div>
        <div style="position:relative;display:flex;align-items:center;gap:16px;margin-bottom:14px">
          <div style="width:68px;height:68px;border-radius:22px;overflow:hidden;box-shadow:0 20px 40px rgba(15,23,42,0.24);background:#ffffff;display:flex;align-items:center;justify-content:center">
            <img src="${MERIEM_IMG}" alt="مريم بوزير" style="width:100%;height:100%;object-fit:cover" />
          </div>
          <div style="display:grid;gap:4px;color:#2e1065">
            <span style="font-weight:800;font-size:20px">مريم بوزير</span>
            <span style="font-size:13px;color:#5b21b6">مرشدة في الاتزان العاطفي والعلاقات</span>
          </div>
        </div>
      </div>

      <div style="padding:24px 30px;background:linear-gradient(135deg,#dcfce7,#f0fdf4);border-bottom:1px solid #bbf7d0">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(34,197,94,0.3)">
            <span style="font-size:26px">✓</span>
          </div>
          <div>
            <h1 style="margin:0;font-size:22px;color:#166534;font-weight:800">🎉 تم تفعيل دخولك VIP!</h1>
            <p style="margin:4px 0 0;font-size:14px;color:#15803d">أصبح بإمكانك حضور جلسة اليوم الثالث الخاصة</p>
          </div>
        </div>
      </div>

      <div style="padding:28px 30px;display:grid;gap:20px;font-size:15px;line-height:1.9;color:#111111;background:#ffffff">
        <p style="margin:0;font-size:16px;color:#111111">مرحبًا <strong style="color:#7c3aed">${greet}</strong>،</p>

        <p style="margin:0">تم تفعيل وصولك إلى جلسة اليوم الثالث VIP بنجاح. يسعدنا انضمامك لهذه الجلسة المتقدمة.</p>

        <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#faf5ff,#fdf4ff);border:2px solid #e9d5ff;box-shadow:0 20px 40px rgba(168,85,247,0.12)">
          <h2 style="margin:0 0 18px;font-size:18px;color:#7c3aed;display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📅</span>
            <span>تفاصيل جلسة VIP</span>
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
                <div style="font-size:16px;font-weight:700;color:#1f2937">${formattedTime} (${durationLabel})</div>
              </div>
            </div>
          </div>
        </div>

        <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;box-shadow:0 20px 40px rgba(124,58,237,0.3)">
          <h3 style="margin:0 0 14px;font-size:17px;display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">🔗</span>
            <span>رابط Zoom لجلسة VIP</span>
          </h3>
          <p style="margin:0 0 16px;font-size:14px;opacity:0.9">احفظي هذا الرابط واستخدميه في وقت الجلسة</p>
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            ${btn(vipMeetingUrl!, "افتحي رابط جلسة VIP الآن")}
          </div>
        </div>

        ${(sourceLine || noteLine) ? `
        <div style="padding:22px;border-radius:18px;background:#fffbeb;border:1px solid #fde68a;display:grid;gap:12px">
          <h3 style="margin:0;font-size:16px;color:#92400e;display:flex;align-items:center;gap:8px">
            <span>🧾</span>
            <span>تفاصيل الدفع</span>
          </h3>
          <ul style="margin:0;padding:0;list-style:none;display:grid;gap:10px;font-size:14px;color:#78350f">
            ${sourceLine}
            ${noteLine}
          </ul>
        </div>
        ` : ''}

        <div style="padding:20px;border-radius:16px;border:1px dashed #d4d4d8;background:#fefce8;text-align:center">
          <p style="margin:0;font-size:15px;color:#713f12">💜 نراك قريبًا في جلسة اليوم الثالث VIP!</p>
        </div>

        <p style="margin:0;font-size:15px;color:#111111">مع محبّتي،<br/><strong style="color:#7c3aed">مريم بوزير</strong></p>
      </div>

      <div style="padding:18px 24px;background:linear-gradient(135deg,#ede9fe,#f7f5ff);border-top:1px solid #e6defd;text-align:center;color:#4c1d95;font-size:13px;font-weight:600">
        فطرة النساء · Fittrah Women
      </div>
    </div>
  </div>
  `.trim()

  const body: Record<string, unknown> = {
    from: FROM,
    to: [email],
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
