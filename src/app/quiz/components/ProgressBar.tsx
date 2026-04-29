interface ProgressBarProps {
  value: number
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
      <div className="quiz-progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  )
}
