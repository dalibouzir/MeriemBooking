import type { Metadata } from 'next'
import QuizPageClient from './QuizPageClient'
import quizQuestions from '@/data/quiz-questions-ar.json'
import type { QuizQuestion } from './types'

export const metadata: Metadata = {
  title: 'اكتشفي نمطك في التربية خلال دقيقة',
  description: 'اختبار سريع من 20 سؤالًا يساعدك تفهمي أسلوبك وتأثيره على طفلك',
}

export default function QuizPage() {
  return <QuizPageClient questions={quizQuestions as QuizQuestion[]} />
}
