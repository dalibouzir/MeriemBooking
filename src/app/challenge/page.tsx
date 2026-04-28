import { getChallengeSettingsAction, getChallengeStatsAction } from './actions'
import ChallengePageNewClient from './ChallengePageNewClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'تحدّي الأم الهادئة في 3 أيام | Fittrah Women',
  description:
    'تحدّي مجاني خلال 3 أيام لمساعدة الأم على الانتقال من التوتر والانفجار إلى بداية هدوء حقيقي من الداخل.',
}

const SCRIPT_DEFAULTS = {
  title: 'تحدّي الأم الهادئة في 3 أيام',
  subtitle: 'من التوتر والانفجار… إلى بداية هدوء حقيقي من الداخل',
  description:
    'أعطيني فقط 90 دقيقة خلال 3 أيام، واكتشفي كيف تبدأين استعادة هدوئك… حتى لو كنتِ عصبية وتحت ضغط يومي.',
  benefits: [
    'لماذا تفقدين السيطرة رغم أنك تعرفين ما هو الصواب.',
    'ما الذي يحرّك ردّة فعلك من الداخل.',
    'لماذا يتكرّر نفس النمط رغم محاولاتك المتكررة.',
  ],
  requirements: [
    'اليوم الأول: افهمي ما يحدث داخلك. لماذا تفقدين السيطرة رغم أنك تعلمين؟ (تبسيط عميق لما يحدث في داخلك).',
    'اليوم الثاني: ابدئي التغيير فعليًا عبر تمارين واستراتيجيات تساعدك على إيقاف ردّة الفعل، التعامل مع trigger، والخروج من نمط التوتر المتكرر.',
    'اليوم الثالث: جلسة تطبيق وأسئلة مباشرة على حالات حقيقية من المشاركات لتطبيق ما تعلّمناه على مواقف واقعية.',
  ],
}

const formatScheduleDate = (dateStr: string, timeZone: string) => {
  if (!dateStr) return 'قريباً'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  try {
    return new Intl.DateTimeFormat('ar-u-nu-latn', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    }).format(date)
  } catch {
    return dateStr
  }
}

const formatScheduleTime = (dateStr: string, timeZone: string) => {
  if (!dateStr) return 'سيتم تحديده'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'سيتم تحديده'
  try {
    return new Intl.DateTimeFormat('ar-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(date)
  } catch {
    return 'سيتم تحديده'
  }
}

export default async function ChallengePage() {
  const [settings, stats] = await Promise.all([
    getChallengeSettingsAction(),
    getChallengeStatsAction(),
  ])

  if (!settings) {
    return (
      <main className="ch-page ch-page-unavailable" dir="rtl" lang="ar">
        <div className="ch-unavailable-card">
          <span className="ch-unavailable-icon">🚧</span>
          <h1>التحدّي غير متاح</h1>
          <p>لم يتم العثور على بيانات التحدي. يرجى المحاولة لاحقًا.</p>
        </div>
      </main>
    )
  }

  const timeZone = settings.timezone || 'UTC'
  const startDateLabel = formatScheduleDate(settings.starts_at, timeZone)
  const meetingTimeLabel = formatScheduleTime(settings.starts_at, timeZone)

  const config = {
    isEnabled: settings.is_active,
    startDateLabel,
    meetingTimeLabel,
    duration: settings.duration_minutes,
    maxSeats: settings.capacity,
    title: settings.title?.trim() || SCRIPT_DEFAULTS.title,
    subtitle: settings.subtitle?.trim() || SCRIPT_DEFAULTS.subtitle,
    description: settings.description?.trim() || SCRIPT_DEFAULTS.description,
    benefits: settings.benefits?.length ? settings.benefits : SCRIPT_DEFAULTS.benefits,
    targetAudience: [
      'فهم حقيقي لما يحدث داخلك في لحظة الضغط.',
      'وعي trigger أساسي يسبب أغلب توترك.',
      'تعلّم استراتيجيات وتمارين بسيطة لتغيير ردّة فعلك.',
    ],
    notFor: [
      'هذا التحدي ليس فقط محتوى، بل مساحة تشعرين فيها أنك مفهومة.',
      'ما تعيشينه ليس ضعفًا… بل نمط يمكن فهمه وتغييره.',
      'هذه ليست نهاية التغيير… لكنها بداية صادقة وواقعية له.',
    ],
    requirements: settings.requirements?.length ? settings.requirements : SCRIPT_DEFAULTS.requirements,
    faqs: [],
  }

  const initialStats = {
    maxSeats: stats.capacity,
    confirmedCount: stats.confirmed_count,
    waitlistCount: stats.waitlist_count,
    remainingSeats: stats.remaining,
    isFull: stats.remaining <= 0,
  }

  return <ChallengePageNewClient config={config} initialStats={initialStats} />
}
