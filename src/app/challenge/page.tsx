import { getChallengeSettingsAction, getChallengeStatsAction } from './actions'
import ChallengePageNewClient from './ChallengePageNewClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'تحدي اونلاين مجاني | Fittrah Women',
  description: 'انضمّي إلى تحدينا المجاني أونلاين واحصلي على دعم شخصي مع مريم بوزير. المقاعد محدودة!',
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

  // If no settings exist, show not found
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

  // Transform settings to config format using correct field names from ChallengeSettings
  const config = {
    isEnabled: settings.is_active,
    startDateLabel,
    meetingTimeLabel,
    duration: settings.duration_minutes,
    maxSeats: settings.capacity,
    title: settings.title,
    subtitle: settings.subtitle,
    description: settings.description,
    benefits: settings.benefits || [],
    targetAudience: [] as string[], // Not in current schema
    notFor: [] as string[], // Not in current schema
    requirements: settings.requirements || [],
    // Transform FAQ from {q, a} to {question, answer}
    faqs: (settings.faq || []).map((f) => ({ question: f.q, answer: f.a })),
  }

  // Transform stats to the expected format using correct field names from ChallengeStats
  const initialStats = {
    maxSeats: stats.capacity,
    confirmedCount: stats.confirmed_count,
    waitlistCount: stats.waitlist_count,
    remainingSeats: stats.remaining,
    isFull: stats.remaining <= 0,
  }

  return (
    <ChallengePageNewClient config={config} initialStats={initialStats} />
  )
}
