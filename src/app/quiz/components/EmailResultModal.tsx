'use client'

import { useMemo } from 'react'
import Modal from './Modal'

interface EmailResultModalProps {
  isOpen: boolean
  isSubmitting: boolean
  submitError: string | null
  name: string
  email: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: () => void
}

export default function EmailResultModal({
  isOpen,
  isSubmitting,
  submitError,
  name,
  email,
  onNameChange,
  onEmailChange,
  onSubmit,
}: EmailResultModalProps) {
  const canSubmit = useMemo(() => {
    const hasName = name.trim().length > 0
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    return hasName && validEmail && !isSubmitting
  }, [name, email, isSubmitting])

  return (
    <Modal
      isOpen={isOpen}
      title="أرسلي نتيجتك إلى بريدك"
      closeLabel="إغلاق"
      actions={(
        <button
          type="button"
          onClick={onSubmit}
          className="challenge-btn challenge-btn-primary quiz-submit-btn"
          disabled={!canSubmit}
        >
          <span className="challenge-btn-text">{isSubmitting ? 'جارٍ الإرسال...' : 'أرسلي نتيجتي'}</span>
        </button>
      )}
    >
      <p className="quiz-modal-teaser">هل تريد الانضمام الى التحدي (مجانا)</p>

      <label className="quiz-field-label" htmlFor="quiz-name">الاسم</label>
      <input
        id="quiz-name"
        className="quiz-input"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="اكتبي اسمك"
        autoComplete="name"
      />

      <label className="quiz-field-label" htmlFor="quiz-email">البريد الإلكتروني</label>
      <input
        id="quiz-email"
        className="quiz-input"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="name@email.com"
        type="email"
        inputMode="email"
        autoComplete="email"
      />

      {submitError ? <p className="quiz-submit-error">{submitError}</p> : null}
    </Modal>
  )
}
