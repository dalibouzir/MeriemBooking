// deno-lint-ignore-file no-explicit-any
// Vercel-friendly: no Deno triple-slash refs, no `jsr:` imports.
// Supabase Edge (Deno) will still find globalThis.Deno at runtime.

// ====== CONFIG ======
type DenoEnv = { env: { get(name: string): string | undefined } }
const DENO: { env?: DenoEnv["env"]; serve?: (h: (req: Request) => Response | Promise<Response>) => void } =
  (globalThis as unknown as { Deno?: DenoEnv & { serve?: (h: (req: Request) => Response | Promise<Response>) => void } }).Deno ?? {}

const getEnv = (k: string): string | undefined => DENO.env?.get?.(k)

const RESEND_API_KEY = getEnv("RESEND_API_KEY")
const FROM = "Acme <onboarding@resend.dev>" // MUST be a verified domain in Resend
const RESEND_ENDPOINT = "https://api.resend.com/emails"

// ====== HELPERS ======
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  })
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function isValidUrl(s: string) {
  try {
    const u = new URL(s)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function toPlainText({
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
}) {
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

// ====== MAIN HANDLER ======
const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") return json(null, 204)

  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405)
  if (!RESEND_API_KEY) return json({ error: "Missing RESEND_API_KEY" }, 500)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { name, email, product, downloadUrl, redeemUrl, token, isVideo } = payload ?? {}

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
      <p><a href="${downloadUrl}" target="_blank">تحميل ${isVideo ? "الفيديو" : "الكتاب"}</a></p>
      <hr/>
      <p>🎁 هذا كود التوكن الخاص بك لحجز مكالمة مجانية (صالح حتى <b>30 يوم</b>):</p>
      <p style="font-size:18px; font-weight:bold; letter-spacing:2px">${token}</p>
      <p>يمكنك الحجز مباشرة من هنا:
        <a href="${redeemUrl}" target="_blank">استبدال التوكن الآن</a>
      </p>
      <p style="color:#777;font-size:12px">لو ما يشتغل الرابط، انسخه والصقه في المتصفح.</p>
      <br/>
      <p>مع المحبة،<br/>فريق مريم</p>
    </div>
  `.trim()

  const text = toPlainText({ name, isVideo: !!isVideo, downloadUrl, token, redeemUrl })

  // Send via Resend
  const r = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [email], subject, html, text }),
  })

  if (!r.ok) {
    const body = await r.text()
    return json({ error: "Resend error", status: r.status, body }, 500)
  }

  return json({ ok: true }, 200)
}

// Use Deno.serve if available (Supabase Edge); otherwise, keep inert in Vercel.
const maybeServe = DENO?.serve
if (typeof maybeServe === "function") {
  maybeServe(handler)
} else if (typeof addEventListener !== "undefined") {
  addEventListener("fetch", (event: any) => {
    event.respondWith(handler(event.request))
  })
}

export default handler
