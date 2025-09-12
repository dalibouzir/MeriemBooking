// deno-lint-ignore-file no-explicit-any
// Vercel-friendly: no Deno triple-slash refs, no `jsr:` imports.

type DenoEnv = { env: { get(name: string): string | undefined } }
const DENO: { env?: DenoEnv["env"]; serve?: (h: (req: Request) => Response | Promise<Response>) => void } =
  (globalThis as unknown as { Deno?: DenoEnv & { serve?: (h: (req: Request) => Response | Promise<Response>) => void } }).Deno ?? {}

const getEnv = (k: string): string | undefined => DENO.env?.get?.(k)

const RESEND_API_KEY = getEnv("RESEND_API_KEY")?.trim()
const ENV_FROM = getEnv("EMAIL_FROM")?.trim()
// Fallback is your verified domain
const FROM = ENV_FROM && ENV_FROM.length > 0 ? ENV_FROM : "Fittrah Moms <noreply@fittrahmoms.com>"
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

const arabicPlainText = ({
  name,
  isVideo,
  downloadUrl,
  token,
  redeemUrl,
}: {
  name: string
  isVideo: boolean
  downloadUrl: string
  token: string
  redeemUrl: string
}) => {
  const type = isVideo ? "الفيديو" : "الكتاب"
  return [
    `مرحبًا ${name}`,
    "",
    `رابط ${type} للتنزيل:`,
    downloadUrl,
    "",
    "🎁 كود التوكن لمكالمة مجانية (صالح 30 يوم):",
    token,
    "",
    "استبدال التوكن الآن:",
    redeemUrl,
    "",
    "لو ما يشتغل الرابط، انسخه والصقه في المتصفح.",
    "",
    "مع المحبة،",
    "فريق مريم",
  ].join("\n")
}

// ------------ handler ------------
const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return json(null, 204)

  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405)

  if (!RESEND_API_KEY) {
    return json({ error: "Missing RESEND_API_KEY (check Supabase secrets / redeploy)" }, 500)
  }

  // Safety: enforce From domain is your verified domain
  // Accepts "Name <user@fittrahmoms.com>" or "user@fittrahmoms.com"
  const fromMatch = FROM.match(/<\s*([^>]+)\s*>/i)
  const fromEmail = (fromMatch ? fromMatch[1] : FROM).toLowerCase()
  if (!fromEmail.endsWith("@fittrahmoms.com")) {
    return json(
      {
        error: "Invalid FROM domain",
        details:
          "EMAIL_FROM must use your verified domain (e.g., Fittrah Moms <noreply@fittrahmoms.com>). Update EMAIL_FROM secret.",
      },
      500,
    )
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { name, email, product, downloadUrl, redeemUrl, token, isVideo, replyTo } = payload ?? {}

  // Basic validation
  const errors: string[] = []
  if (!name || typeof name !== "string") errors.push("name is required")
  if (!email || !isValidEmail(email)) errors.push("valid email is required")
  if (!product || typeof product !== "string") errors.push("product is required")
  if (!downloadUrl || !isValidUrl(downloadUrl)) errors.push("valid downloadUrl is required")
  if (!redeemUrl || !isValidUrl(redeemUrl)) errors.push("valid redeemUrl is required")
  if (!token || typeof token !== "string") errors.push("token is required")

  if (errors.length) return json({ error: "Validation failed", details: errors }, 400)

  const subject = isVideo ? "وصول الماستر كلاس + كود مكالمة مجانية" : "وصول الكتاب + كود مكالمة مجانية"

  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right">
      <h2>مرحبًا ${name} 👋</h2>
      <p>شكراً لتعبئة الفورم. هذا رابط ${isVideo ? "الفيديو" : "الكتاب"} للتنزيل:</p>
      <p><a href="${downloadUrl}" target="_blank" rel="noopener noreferrer">تحميل ${isVideo ? "الفيديو" : "الكتاب"}</a></p>
      <hr/>
      <p>🎁 هذا كود التوكن الخاص بك لحجز مكالمة مجانية (صالح حتى <b>30 يوم</b>):</p>
      <p style="font-size:18px;font-weight:bold;letter-spacing:2px">${token}</p>
      <p>يمكنك الحجز مباشرة من هنا:
        <a href="${redeemUrl}" target="_blank" rel="noopener noreferrer">استبدال التوكن الآن</a>
      </p>
      <p style="color:#777;font-size:12px">لو ما يشتغل الرابط، انسخه والصقه في المتصفح.</p>
      <br/>
      <p>مع المحبة،<br/>فريق مريم</p>
    </div>
  `.trim()

  const text = arabicPlainText({ name, isVideo: !!isVideo, downloadUrl, token, redeemUrl })

  // Build body for Resend
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
      // Surface Resend’s error for quick debugging
      const bodyText = await r.text().catch(() => "")
      return json(
        {
          error: "Resend error",
          status: r.status,
          // Most common cause of 403 is wrong workspace key vs. verified domain
          hint:
            r.status === 403
              ? "Ensure this API key belongs to the Resend workspace where fittrahmoms.com is Verified, and FROM uses @fittrahmoms.com."
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
  addEventListener("fetch", (event: any) => {
    event.respondWith(handler(event.request))
  })
}

export default handler
