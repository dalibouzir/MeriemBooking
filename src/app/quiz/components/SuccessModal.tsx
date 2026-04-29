'use client'

import Modal from './Modal'

interface SuccessModalProps {
  isOpen: boolean
  onJoinChallenge: () => void
  onClose: () => void
}

export default function SuccessModal({ isOpen, onJoinChallenge, onClose }: SuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="تم إرسال نتيجتك إلى بريدك"
      closeLabel="إغلاق"
      onClose={onClose}
      actions={(
        <div className="quiz-success-actions">
          <button type="button" className="challenge-btn challenge-btn-primary quiz-submit-btn" onClick={onJoinChallenge}>
            <span className="challenge-btn-text">نعم، أريد الانضمام للتحدي</span>
          </button>
          <button type="button" className="challenge-btn challenge-btn-secondary quiz-submit-btn" onClick={onClose}>
            <span className="challenge-btn-text">ليس الآن</span>
          </button>
        </div>
      )}
    >
      <p className="quiz-success-copy">هل تريدين الانضمام الآن إلى صفحة التحدي؟</p>
    </Modal>
  )
}
