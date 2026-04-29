interface TimerProps {
  totalSeconds: number
}

function formatTimer(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function Timer({ totalSeconds }: TimerProps) {
  return <span className="quiz-timer-pill">{formatTimer(totalSeconds)}</span>
}
