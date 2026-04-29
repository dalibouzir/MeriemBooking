'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import QuizCard from './components/QuizCard'
import EmailResultModal from './components/EmailResultModal'
import SuccessModal from './components/SuccessModal'
import { calculateQuizResult } from './scoring'
import type { QuizAnswers, QuizOption, QuizQuestion } from './types'

const TOTAL_DURATION_SECONDS = 90

interface QuizPageClientProps {
  questions: QuizQuestion[]
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function buildInitialAnswers(questions: QuizQuestion[]): QuizAnswers {
  return questions.reduce<QuizAnswers>((acc, question) => {
    acc[question.id] = null
    return acc
  }, {})
}

export default function QuizPageClient({ questions }: QuizPageClientProps) {
  const router = useRouter()
  const audioContextRef = useRef<AudioContext | null>(null)
  const prevTimeLeftRef = useRef(TOTAL_DURATION_SECONDS)

  const totalQuestions = questions.length

  const [quizStarted, setQuizStarted] = useState(false)
  const [answers, setAnswers] = useState<QuizAnswers>(() => buildInitialAnswers(questions))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION_SECONDS)

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isTimeoutNoticeVisible, setIsTimeoutNoticeVisible] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const nextQuestion = questions[currentIndex + 1]
  const result = useMemo(() => calculateQuizResult(answers), [answers])

  const resetQuizState = (nextQuizStarted: boolean) => {
    setQuizStarted(nextQuizStarted)
    setAnswers(buildInitialAnswers(questions))
    setCurrentIndex(0)
    setDirection(1)
    setTimeLeft(TOTAL_DURATION_SECONDS)
    prevTimeLeftRef.current = TOTAL_DURATION_SECONDS
    setIsEmailModalOpen(false)
    setIsSuccessModalOpen(false)
    setSubmitError(null)
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!quizStarted || isEmailModalOpen || isSuccessModalOpen) return
    if (timeLeft <= 0) return

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [quizStarted, timeLeft, isEmailModalOpen, isSuccessModalOpen])

  useEffect(() => {
    if (!isTimeoutNoticeVisible) return

    const hideTimer = window.setTimeout(() => {
      setIsTimeoutNoticeVisible(false)
    }, 5000)

    return () => window.clearTimeout(hideTimer)
  }, [isTimeoutNoticeVisible])

  const playClick = () => {
    try {
      const context = audioContextRef.current ?? new window.AudioContext()
      audioContextRef.current = context

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(880, now)
      oscillator.frequency.exponentialRampToValueAtTime(720, now + 0.07)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.09)
    } catch {
      // Audio feedback is enhancement-only.
    }
  }

  const playCountdownTick = () => {
    try {
      const context = audioContextRef.current ?? new window.AudioContext()
      audioContextRef.current = context

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(1320, now)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.05)
    } catch {
      // Audio feedback is enhancement-only.
    }
  }

  const playTimeUpSound = () => {
    try {
      const context = audioContextRef.current ?? new window.AudioContext()
      audioContextRef.current = context
      const now = context.currentTime

      const gain = context.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
      gain.connect(context.destination)

      const notes = [880, 1046.5, 1318.5]
      notes.forEach((freq, index) => {
        const osc = context.createOscillator()
        osc.type = 'triangle'
        const start = now + index * 0.08
        osc.frequency.setValueAtTime(freq, start)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.92, start + 0.2)
        osc.connect(gain)
        osc.start(start)
        osc.stop(start + 0.22)
      })
    } catch {
      // Audio feedback is enhancement-only.
    }
  }

  useEffect(() => {
    const prev = prevTimeLeftRef.current
    const isCountingDown = quizStarted && !isEmailModalOpen && !isSuccessModalOpen
    const isLastTenSeconds = timeLeft <= 10 && timeLeft > 0
    const secondChangedDown = timeLeft < prev

    if (isCountingDown && isLastTenSeconds && secondChangedDown) {
      playCountdownTick()
    }

    if (isCountingDown && timeLeft === 0 && prev > 0) {
      playTimeUpSound()
      resetQuizState(false)
      setIsTimeoutNoticeVisible(true)
    }

    prevTimeLeftRef.current = timeLeft
  }, [timeLeft, quizStarted, isEmailModalOpen, isSuccessModalOpen])

  const handleStartQuiz = () => {
    resetQuizState(true)
    setIsTimeoutNoticeVisible(false)
  }

  const handleSelectOption = (option: QuizOption) => {
    if (!quizStarted || !currentQuestion) return

    playClick()

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }))

    if (currentIndex >= totalQuestions - 1) {
      window.setTimeout(() => setIsEmailModalOpen(true), 160)
      return
    }

    setDirection(1)
    setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
  }

  const handlePreviousQuestion = () => {
    if (currentIndex === 0) return
    setDirection(-1)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleSubmitResult = async () => {
    if (!name.trim() || !email.trim()) {
      setSubmitError('يرجى تعبئة الاسم والبريد الإلكتروني.')
      return
    }

    if (!isValidEmail(email)) {
      setSubmitError('صيغة البريد الإلكتروني غير صحيحة.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          resultType: result.mainType.label,
          secondaryType: result.secondaryType?.label ?? null,
          shadowType: result.shadowTypeLabel,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'تعذّر الإرسال. حاولي مرة أخرى.')
      }

      setIsEmailModalOpen(false)
      setIsSuccessModalOpen(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'حدث خطأ أثناء الإرسال.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuccessContinue = () => {
    router.push('/challenge')
  }

  return (
    <main className="quiz-premium-page challenge-page" dir="rtl" lang="ar">
      {isTimeoutNoticeVisible ? (
        <div className="quiz-timeout-alert" role="alert" aria-live="polite">
          انتهى الوقت. حاولي مرة أخرى من البداية.
        </div>
      ) : null}

      <div className="challenge-page-bg" aria-hidden="true">
        <span className="challenge-page-blob challenge-page-blob-1" />
        <span className="challenge-page-blob challenge-page-blob-2" />
        <span className="challenge-page-blob challenge-page-blob-3" />
      </div>

      <div className="container quiz-page-shell">
        <section className="quiz-hero-premium reveal is-inview" aria-label="مقدمة الاختبار">
          <span className="quiz-hero-decor quiz-hero-decor-left" aria-hidden="true" />
          <span className="quiz-hero-decor quiz-hero-decor-right" aria-hidden="true" />
          <span className="quiz-hero-wave" aria-hidden="true" />

          <h1 className="challenge-title">اكتشفي نمطك في التربية خلال دقيقة</h1>
          <p className="quiz-hero-subtitle">
            اختبار سريع من 20 سؤالًا يساعدك تفهمي أسلوبك وتأثيره على طفلك
          </p>

          <div className="quiz-info-badges">
            <span className="challenge-badge challenge-badge-timezone"><span className="challenge-badge-icon">⏱</span>المدة: دقيقة ونصف</span>
            <span className="challenge-badge challenge-badge-timezone"><span className="challenge-badge-icon">🧠</span>20 سؤال</span>
            <span className="challenge-badge challenge-badge-timezone"><span className="challenge-badge-icon">💡</span>نتيجة فورية على بريدك</span>
          </div>

          <button type="button" className="challenge-btn challenge-btn-primary challenge-btn-lg" onClick={handleStartQuiz}>
            <span className="challenge-btn-text">ابدئي الكويز الآن</span>
            <span className="challenge-btn-shine" aria-hidden="true" />
          </button>
        </section>

        {!quizStarted ? (
          <section className="quiz-about-section reveal is-inview" aria-label="حول الاختبار">
            <div className="challenge-section-header">
              <h2 className="challenge-section-title">ما هذا الاختبار؟</h2>
              <p className="quiz-about-copy">
                هذا الاختبار مصمم لمساعدتك على فهم نمطك في التربية بطريقة بسيطة وسريعة، مع خطوات عملية تساعدك على تحسين علاقتك مع طفلك دون ضغط.
              </p>
            </div>

            <div className="quiz-about-grid">
              <article className="quiz-about-card">تفهمي نفسك</article>
              <article className="quiz-about-card">تعرفي نقاط قوتك</article>
              <article className="quiz-about-card">خطوات عملية بسيطة</article>
            </div>
          </section>
        ) : null}

        <section className="quiz-main-section" aria-label="قسم الأسئلة">
          <div className="quiz-card-stage">
            {quizStarted ? (
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={currentQuestion.id}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ x: d > 0 ? 90 : -90, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d > 0 ? -90 : 90, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <QuizCard
                    question={currentQuestion}
                    current={currentIndex + 1}
                    total={totalQuestions}
                    selectedOption={answers[currentQuestion.id]}
                    timeLeft={timeLeft}
                    onSelect={handleSelectOption}
                    onBack={handlePreviousQuestion}
                    canGoBack={currentIndex > 0}
                  />
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>

          {nextQuestion ? <p className="quiz-preload-hint" aria-hidden="true">{nextQuestion.text}</p> : null}
        </section>
      </div>

      <EmailResultModal
        isOpen={isEmailModalOpen}
        isSubmitting={isSubmitting}
        submitError={submitError}
        name={name}
        email={email}
        onNameChange={setName}
        onEmailChange={setEmail}
        onSubmit={handleSubmitResult}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onJoinChallenge={handleSuccessContinue}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </main>
  )
}
