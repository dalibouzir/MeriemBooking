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
  const type = isVideo ? 'الفيديو' : 'الكتاب'
  return [
    '🌸 فطرة الأمهات — Fittrah Moms',
    `مرحبًا ${name} 👋`,
    '',
    `💜 رابط ${type}:`,
    downloadUrl,
    '',
    '🎁 كود مكالمتك المجانية (صالح 30 يوم):',
    token,
    '',
    '✨ خطوات الاستفادة:',
    '1. افتحي رابط التنزيل أعلاه.',
    '2. احتفظي بالكود أو انسخيه.',
    '3. احجزي مكالمتك عبر الرابط التالي:',
    redeemUrl,
    '',
    'لو ما يشتغل أي رابط انسخي العنوان والصقيه في المتصفح.',
    '',
    'نحن هنا لأي سؤال 💬',
    'فريق فطرة الأمهات',
  ].join('\n')
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

  const subject = isVideo ? "وصول الفيديو + كود مكالمة مجانية" : "وصول الكتاب + كود مكالمة مجانية"

  const btn = (href: string, label: string, colorA = '#7c3aed', colorB = '#a855f7') => `
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
    <div style="font-family:'Tajawal',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#1f2937;background:#f9f7ff;padding:28px 20px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 20px 45px rgba(124,58,237,0.12);overflow:hidden;border:1px solid #ede9fe">
        <div style="padding:20px 26px;background:linear-gradient(135deg, rgba(124,58,237,0.65), rgba(168,85,247,0.35));display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;border-radius:16px;overflow:hidden;box-shadow:0 10px 20px rgba(15,23,42,0.18);background:#fff;display:flex;align-items:center;justify-content:center;">
            <img src="https://www.fittrahmoms.com/Meriem.webp" alt="Fittrah Moms" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="display:grid;gap:6px;color:#fdf4ff;">
            <span style="font-weight:800;font-size:18px;letter-spacing:0.6px">فطرة الأمهات · Fittrah Moms</span>
            <span style="font-size:14px;opacity:.9">نرافقك بخطوات عملية لبيت أكثر هدوءًا وتربية بوعي.</span>
          </div>
        </div>

        <div style="padding:24px 28px;display:grid;gap:18px">
          <div style="display:flex;align-items:center;gap:10px;color:#6d28d9;font-size:16px;font-weight:800;">
            <span style="font-size:22px">🌷</span>
            <span>مرحبًا ${name}</span>
          </div>
          <p style="margin:-6px 0 4px;font-size:14px;color:#4c1d95;line-height:1.7">جهّزنا لك كل شيء لتبدئي فورًا — استمتعي بالتنزيل وموعد المكالمة المجانية.</p>

          <div>
            <p style="margin:0 0 10px;font-weight:700;font-size:14px;color:#4338ca">✨ رابط ${isVideo ? 'الفيديو' : 'الكتاب'}:</p>
            ${btn(downloadUrl, isVideo ? 'تحميل الفيديو الآن' : 'تحميل الكتاب الآن')}
          </div>

          ${infoRow('🎁', 'كود مكالمتك المجانية — صالح 30 يوم:', token)}

          <div style="background:#f8fafc;border-radius:14px;padding:16px 18px;border:1px solid #e2e8f0;display:grid;gap:12px">
            <p style="margin:0;font-weight:700;color:#334155">كيف تستفيدين من الكود؟</p>
            <ol style="margin:0;padding-right:18px;line-height:1.8;color:#475569;font-size:14px">
              <li>حمّلي ${isVideo ? 'الفيديو' : 'الكتاب'} واحتفظي به على جهازك.</li>
              <li>انسخي كود المكالمة من البطاقة البنفسجية.</li>
              <li>احجزي مكالمتك عبر الرابط التالي وحددي الوقت المناسب لك.</li>
            </ol>
            ${btn(redeemUrl, 'احجزي مكالمتك المجانية', '#0f766e', '#14b8a6')}
          </div>

          <div style="background:#fefce8;border-radius:14px;padding:16px;border:1px solid #fef08a;color:#854d0e;font-size:13px;line-height:1.7">
            <strong>نصيحة:</strong> لو ما اشتغل أي رابط ضغطي يمين ثم "نسخ الرابط" والصقيه في المتصفح يدويًا.
          </div>

          <div style="text-align:center">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px">بحاجة لمساعدة؟ راسلينا على واتساب في أي وقت.</p>
            <a href="https://wa.me/" style="color:#2563eb;text-decoration:none;font-weight:700">💬 تواصل مع الدعم</a>
          </div>
        </div>

        <div style="padding:18px 28px;background:#f5f3ff;border-top:1px solid #ede9fe;text-align:center;color:#5b21b6;font-size:13px">
          مع المحبة، فريق فطرة الأمهات 💜 · <a href="https://www.fittrahmoms.com" style="color:#4c1d95;text-decoration:none;font-weight:700">زيارة الموقع</a>
        </div>
      </div>
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
