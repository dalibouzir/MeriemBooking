import { getChallengeSettingsAction, getChallengeStatsAction } from './actions'
import ChallengePageNewClient from './ChallengePageNewClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'تحدي اونلاين مجاني | Fittrah Moms',
  description: 'انضمّي إلى تحدينا المجاني أونلاين واحصلي على دعم شخصي مع مريم بوزير. المقاعد محدودة!',
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

  // Transform settings to config format using correct field names from ChallengeSettings
  const config = {
    isEnabled: settings.is_active,
    startDate: settings.starts_at,
    endDate: '', // Not in current schema
    meetingTime: settings.starts_at, // Use starts_at as meeting time
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
