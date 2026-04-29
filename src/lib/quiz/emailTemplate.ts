import { MAIN_TYPE_DEFINITIONS } from '@/app/quiz/scoring'

export const QUIZ_EMAIL_SUBJECT = 'نتيجتك في اختبار أنماط التربية'

export type QuizResultEmailInput = {
  name: string
  resultType: string
  secondaryType: string | null
  shadowType: string
  avatarUrl?: string
}

export function renderQuizResultEmailHtml(input: QuizResultEmailInput) {
  const mainTypeDefinition = Object.values(MAIN_TYPE_DEFINITIONS)
    .find((type) => type.label === input.resultType)

  const mainTypeDescriptionHtml = mainTypeDefinition?.fullDescriptionHtml
    ?? `<h3 style="margin:0 0 8px;color:#2c1f4a;">${escapeHtml(input.resultType)}</h3>`

  const mixedLine = input.secondaryType
    ? `<p style="margin:0 0 8px;color:#4b2e71;">تميلين أيضًا إلى: <strong>${escapeHtml(input.secondaryType)}</strong></p>`
    : ''

  const avatarUrl = input.avatarUrl?.trim() || 'https://fittrahwomen.com/Meriem.jpeg'

  return `
    <div dir="rtl" lang="ar" style="font-family:Tajawal,Cairo,Arial,sans-serif;background:#f7f2ff;padding:24px 12px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eee3ff;border-radius:24px;overflow:hidden;box-shadow:0 16px 42px rgba(120,78,180,0.12);">
        <div style="padding:18px 20px;background:linear-gradient(135deg,#7c3aed 0%,#c026d3 100%);color:#fff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-size:20px;font-weight:900;line-height:1.3;">Meriem Bouzir</div>
                <div style="margin-top:4px;font-size:14px;opacity:0.92;">Fittrah Women</div>
              </td>
              <td style="width:68px;vertical-align:middle;text-align:left;">
                <img
                  src="${escapeHtml(avatarUrl)}"
                  alt="Meriem Bouzir"
                  width="56"
                  height="56"
                  style="display:inline-block;width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.72);"
                />
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:22px;">
          <p style="margin:0 0 12px;color:#6d4ca7;font-weight:700;">مرحبًا ${escapeHtml(input.name)}،</p>
          <p style="margin:0 0 8px;color:#4b2e71;">نمطك الأساسي: <strong>${escapeHtml(input.resultType)}</strong></p>
          ${mixedLine}
          <p style="margin:0 0 18px;color:#4b2e71;">النمط الظلّي: <strong>${escapeHtml(input.shadowType)}</strong></p>

          <div style="padding:16px;border:1px solid #efe6ff;border-radius:16px;background:#fcf9ff;color:#2c1f4a;line-height:1.95;">
            ${mainTypeDescriptionHtml}
          </div>

          <div style="margin-top:20px;text-align:center;">
            <a
              href="https://fittrahwomen.com/challenge"
              style="display:inline-block;padding:12px 20px;border-radius:12px;background:#c02693;color:#fff;text-decoration:none;font-weight:800;"
            >
              انضمي إلى تحدي الأم الهادئة (3 أيام)
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
