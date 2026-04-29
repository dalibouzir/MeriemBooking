'use client'

import type { QuizOption, QuizQuestion } from '../types'
import ProgressBar from './ProgressBar'
import Timer from './Timer'
import OptionCard from './OptionCard'

interface QuizCardProps {
  question: QuizQuestion
  current: number
  total: number
  selectedOption: QuizOption | null
  timeLeft: number
  onSelect: (option: QuizOption) => void
  onBack: () => void
  canGoBack: boolean
}

export default function QuizCard({
  question,
  current,
  total,
  selectedOption,
  timeLeft,
  onSelect,
  onBack,
  canGoBack,
}: QuizCardProps) {
  const progressValue = (current / total) * 100

  return (
    <article className="quiz-card">
      <div className="quiz-card-meta">
        <Timer totalSeconds={timeLeft} />
        <span className="quiz-step-count">{`${current} / ${total}`}</span>
      </div>

      <ProgressBar value={progressValue} />

      <h2 className="quiz-card-question">{question.text}</h2>

      <div className="quiz-options-grid">
        {question.options.map((option) => (
          <OptionCard
            key={`${question.id}-${option.key}`}
            option={option}
            selected={selectedOption?.key === option.key}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="quiz-card-nav">
        <button
          type="button"
          className="challenge-btn challenge-btn-secondary quiz-prev-btn"
          onClick={onBack}
          disabled={!canGoBack}
        >
          <span className="challenge-btn-text">السؤال السابق</span>
        </button>
      </div>
    </article>
  )
}
