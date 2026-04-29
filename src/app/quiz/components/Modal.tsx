import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
  actions?: ReactNode
  closeLabel?: string
  onClose?: () => void
}

export default function Modal({
  isOpen,
  title,
  children,
  actions,
  closeLabel = 'إغلاق',
  onClose,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="quiz-modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="quiz-modal-shell">
        <div className="quiz-modal-head">
          <h3>{title}</h3>
          {onClose ? (
            <button type="button" className="quiz-modal-close" onClick={onClose} aria-label={closeLabel}>
              ×
            </button>
          ) : null}
        </div>
        <div className="quiz-modal-body">{children}</div>
        {actions ? <div className="quiz-modal-actions">{actions}</div> : null}
      </div>
    </div>
  )
}
