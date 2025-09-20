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

const arabicPlainTextRequested = ({
  name,
  downloadUrl,
  token,
  redeemUrl,
}: {
  name?: string
  downloadUrl: string
  token: string
  redeemUrl: string
}) => {
  const greet = name && name.trim().length > 0 ? name.trim() : "عزيزتي الأم"
  return [
    "العنوان: 🎁 الكتيّب المجاني بين يديك الآن!",
    "",
    `مرحبًا ${greet}،`,
    "",
    "عزيزتي الأمّ مبروك! 👏 لقد خطوتِ أول خطوة نحو استعادة توازنك وهدوئك.",
    "الكتيّب الإلكتروني المجاني الخاص بك جاهز للتحميل الآن.",
    "",
    "📥 لتحمليه مباشرة اضغطي هنا:",
    `👉 ${downloadUrl}`,
    "",
    "في هذا الكتيب ستجدين أدوات واستراتيجيات عملية تساعدك على:",
    "✨ إدارة مشاعرك بوعي وهدوء",
    "✨ استعادة أنوثتك واتصالك بذاتك",
    "✨ وضع حدود صحية والتعامل مع العلاقات السامة",
    "",
    "خذي وقتك في قراءته، وابدئي بتطبيق خطوة صغيرة اليوم، لتشعري بخفّة وطمأنينة أكثر، وتستمتعي بدورك كامرأة وأم بكل حضور وفرح.",
    "",
    "💌 أنا هنا دائمًا لأرافقك في هذه الرحلة.",
    "",
    "مع محبّتي،",
    "مريم بوزير ",
    "",
    "— — —",
    "🎁 كود المكالمة المجانية:",
    token,
    "احجزي الموعد عبر الرابط:",
    redeemUrl,
  ].join("\n")
}

// ------------ handler ------------
type RequestPayload = {
  name?: string
  email?: string
  downloadUrl?: string
  token?: string
  redeemUrl?: string
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
        details:
          "EMAIL_FROM must use your verified domain (e.g., Fittrah Moms <noreply@fittrahmoms.com>). Update EMAIL_FROM secret.",
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

  const { name, email, downloadUrl, token, redeemUrl, replyTo, meriemImgUrl } = payload ?? {}

  // Minimal validation (name optional per requested copy)
  const errors: string[] = []
  if (!email || !isValidEmail(email)) errors.push("valid email is required")
  if (!downloadUrl || !isValidUrl(downloadUrl)) errors.push("valid downloadUrl is required")
  if (!redeemUrl || !isValidUrl(redeemUrl)) errors.push("valid redeemUrl is required")
  if (!token || typeof token !== "string") errors.push("token is required")

  if (errors.length) return json({ error: "Validation failed", details: errors }, 400)

  const subject = "🎁 الكتيّب المجاني بين يديك الآن!"
  const greet = typeof name === "string" && name.trim().length > 0 ? name.trim() : "عزيزتي الأم"

  const ensuredEmail = email as string
  const ensuredDownloadUrl = downloadUrl as string
  const ensuredToken = token as string
  const ensuredRedeemUrl = redeemUrl as string

  const MERIEM_IMG =
    typeof meriemImgUrl === "string" && isValidUrl(meriemImgUrl) && meriemImgUrl
      ? meriemImgUrl
      : "https://www.fittrahmoms.com/Meriem.webp"

  const btn = (href: string, label: string, colorA = "#7c3aed", colorB = "#a855f7") => `
    <a href="${href}" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(90deg, ${colorA}, ${colorB});color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:800;font-size:14px;box-shadow:0 12px 24px rgba(124,58,237,.18)" target="_blank" rel="noopener noreferrer">
      <span style="font-size:18px">🔗</span>
      <span>${label}</span>
    </a>
  `

  const infoRow = (icon: string, label: string, value: string) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#faf5ff;border:1px solid #e9d5ff;margin-top:10px">
      <div style="font-size:22px">${icon}</div>
      <div style="display:grid;gap:2px">
        <span style="font-size:12px;color:#6b7280">${label}</span>
        <span style="font-size:16px;font-weight:700;color:#5b21b6">${value}</span>
      </div>
    </div>
  `

  const html = `
  <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;background:#f4f3ff;padding:34px 18px;color:#111111">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:22px;border:1px solid #e6defd;box-shadow:0 26px 54px rgba(88,63,199,0.14);overflow:hidden">
      
      <!-- Header: Meriem Bouzir -->
      <div style="padding:26px 28px;background:linear-gradient(140deg,#f6edff,#eef2ff);border-bottom:1px solid #e6defd;position:relative">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at top left, rgba(168,85,247,0.18), transparent 62%),radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 55%);"></div>
        <div style="position:relative;display:flex;align-items:center;gap:16px;margin-bottom:14px">
          <div style="width:64px;height:64px;border-radius:20px;overflow:hidden;box-shadow:0 20px 36px rgba(15,23,42,0.22);background:#ffffff;display:flex;align-items:center;justify-content:center">
            <img src="${MERIEM_IMG}" alt="مريم بوزير" style="width:100%;height:100%;object-fit:cover" />
          </div>
          <div style="display:grid;gap:4px;color:#2e1065">
            <span style="font-weight:800;font-size:19px">مريم بوزير</span>
            <span style="font-size:13px;color:#5b21b6">مدرّبة علاقات ومرافقة للأمهات</span>
          </div>
        </div>
        <div style="position:relative;display:flex;align-items:center;gap:10px;color:#4338ca;font-weight:700;font-size:14px">
          <span>رحلة التوازن بخطوات بسيطة</span>
          <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:#7c3aed"></span>
          <span>دعم قلبي معك في كل مرحلة</span>
        </div>
      </div>

      <!-- Title block -->
      <div style="padding:28px 30px 10px;background:#ffffff;color:#111111">
        <div style="display:grid;gap:12px">
          <h1 style="margin:0;font-size:20px;color:#4c1d95">🎁 الكتيّب المجاني بين يديك الآن!</h1>
          <div style="height:3px;width:64px;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:999px"></div>
        </div>
      </div>

      <!-- Requested copy -->
      <div style="padding:0 30px 28px;display:grid;gap:18px;font-size:15px;line-height:2;color:#111111;background:#ffffff">
        <p style="margin:0;font-size:15px;color:#111111">مرحبًا <strong>${greet}</strong>،</p>

        <div style="padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,rgba(236,233,255,0.85),#ffffff);border:1px solid #d9d3ff;box-shadow:0 20px 34px rgba(124,58,237,0.08)">
          <p style="margin:0;font-size:15px;color:#111111">
            عزيزتي الأمّ مبروك! 👏 لقد خطوتِ أول خطوة نحو استعادة توازنك وهدوئك.<br/>
            الكتيّب الإلكتروني المجاني الخاص بك جاهز للتحميل الآن.
          </p>
        </div>

        <div style="padding:20px;border-radius:18px;background:#fdf4ff;border:1px solid #e9d5ff;box-shadow:0 18px 30px rgba(192,132,252,0.12)">
          <div style="color:#4338ca;font-weight:700;margin-bottom:10px">📥 لتحمليه مباشرة اضغطي هنا:</div>
          <div style="margin-bottom:12px;font-weight:700;color:#5b21b6">👉 <a href="${ensuredDownloadUrl}" target="_blank" rel="noopener noreferrer" style="color:#5b21b6;text-decoration:none">رابط التحميل</a></div>
          <div style="display:flex;flex-wrap:wrap;gap:12px">${btn(ensuredDownloadUrl, "تحميل الكتيّب الآن")}</div>
        </div>

        <div style="padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;display:grid;gap:12px">
          <p style="margin:0 0 6px 0;font-weight:700;color:#334155">في هذا الكتيب ستجدين أدوات واستراتيجيات عملية تساعدك على:</p>
          <ul style="margin:0;padding:0;list-style:none;display:grid;gap:10px;font-size:14px;color:#0f172a">
            <li style="display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px">✨</span><span>إدارة مشاعرك بوعي وهدوء</span></li>
            <li style="display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px">✨</span><span>استعادة أنوثتك واتصالك بذاتك</span></li>
            <li style="display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px">✨</span><span>وضع حدود صحية والتعامل مع العلاقات السامة</span></li>
          </ul>
        </div>

        <p style="margin:0;font-size:15px;color:#111111">
          خذي وقتك في قراءته، وابدئي بتطبيق خطوة صغيرة اليوم، لتشعري بخفّة وطمأنينة أكثر،
          وتستمتعي بدورك كامرأة وأم بكل حضور وفرح.
        </p>

        <div style="padding:18px 20px;border-radius:16px;border:1px dashed #d4d4d8;background:#fffaf5;color:#111111">
          <p style="margin:0;font-size:14px">💌 أنا هنا دائمًا لأرافقك في هذه الرحلة.</p>
        </div>

        <p style="margin:0;font-size:15px;color:#111111">مع محبّتي،<br/>مريم بوزير</p>

        <!-- Redeem code block (preserved) -->
        ${infoRow('🎁', 'كود مكالمتك المجانية — صالح 30 يوم:', ensuredToken)}
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:12px">
          ${btn(ensuredRedeemUrl, "احجزي مكالمتك المجانية", "#0f766e", "#14b8a6")}
        </div>
      </div>

      <div style="padding:16px 24px;background:linear-gradient(135deg,#ede9fe,#f7f5ff);border-top:1px solid #e6defd;text-align:center;color:#4c1d95;font-size:12px;font-weight:600">
        فطرة الأمهات · Fittrah Moms
      </div>
    </div>
  </div>
  `.trim()

  const text = arabicPlainTextRequested({ name, downloadUrl: ensuredDownloadUrl, token: ensuredToken, redeemUrl: ensuredRedeemUrl })

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
  addEventListener("fetch", (event: unknown) => {
    const fetchEvent = event as EdgeFetchEvent
    fetchEvent.respondWith(handler(fetchEvent.request))
  })
}

export default handler
