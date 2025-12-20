'use client'

import { useState, useEffect, useCallback } from 'react'
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useChallengeContext } from '../ChallengeContext'
import { registerChallengeAction, getChallengeStatsAction } from '../actions'

export default function ChallengeModalNew() {
  const {
    stats,
    updateStats,
    modalState,
    closeModal,
    setModalState,
    registrationResult,
    setRegistrationResult,
    errorMessage,
    setErrorMessage,
  } = useChallengeContext()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalState !== 'closed') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalState])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalState !== 'closed' && modalState !== 'loading') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalState, closeModal])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim()) return

    setModalState('loading')

    try {
      // Create FormData for the action
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())
      
      const result = await registerChallengeAction(formData)

      if (result.status === 'success') {
        setRegistrationResult({
          registrationId: result.registration_id,
        })
        setModalState('success')
      } else if (result.status === 'full') {
        // Registered to waitlist
        setRegistrationResult({
          registrationId: result.registration_id,
        })
        setModalState('waitlist')
      } else if (result.status === 'already_registered') {
        setErrorMessage('هذا البريد الإلكتروني مسجّل بالفعل في التحدي.')
        setModalState('error')
      } else {
        setErrorMessage(result.error || 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.')
        setModalState('error')
      }

      // Refresh stats
      const newStats = await getChallengeStatsAction()
      updateStats({
        maxSeats: newStats.capacity,
        confirmedCount: newStats.confirmed_count,
        waitlistCount: newStats.waitlist_count,
        remainingSeats: newStats.remaining,
        isFull: newStats.remaining <= 0,
      })
    } catch {
      setErrorMessage('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
      setModalState('error')
    }
  }, [name, email, setModalState, setRegistrationResult, setErrorMessage, updateStats])

  const handleCopyLink = useCallback(() => {
    if (registrationResult?.meetLink) {
      navigator.clipboard.writeText(registrationResult.meetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [registrationResult?.meetLink])

  const handleClose = useCallback(() => {
    closeModal()
    // Reset form after animation
    setTimeout(() => {
      setName('')
      setEmail('')
      setCopied(false)
    }, 300)
  }, [closeModal])

  if (modalState === 'closed') return null

  return (
    <div 
      className="ch-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && modalState !== 'loading') {
          handleClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="ch-modal-card">
        {/* Decorative blobs */}
        <div className="ch-modal-decor" aria-hidden="true">
          <div className="ch-modal-blob ch-modal-blob-1" />
          <div className="ch-modal-blob ch-modal-blob-2" />
        </div>

        <div className="ch-modal-inner">
          {/* Header */}
          <div className="ch-modal-header">
            <div className="ch-modal-header-content">
              <h2 id="modal-title" className="ch-modal-title">
                {modalState === 'form' && (stats.isFull ? '🔔 قائمة الانتظار' : '✨ سجّلي في التحدي')}
                {modalState === 'loading' && '⏳ جارٍ التسجيل...'}
                {modalState === 'success' && '🎉 تم التسجيل بنجاح!'}
                {modalState === 'waitlist' && '📋 تمت إضافتك لقائمة الانتظار'}
                {modalState === 'error' && '❌ حدث خطأ'}
              </h2>
            </div>

            {modalState !== 'loading' && (
              <button
                type="button"
                className="ch-modal-close"
                onClick={handleClose}
                aria-label="إغلاق"
              >
                <XMarkIcon className="ch-modal-close-icon" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="ch-modal-body">
            {/* Form State */}
            {modalState === 'form' && (
              <form onSubmit={handleSubmit} className="ch-form">
                <div className="ch-form-field">
                  <label htmlFor="name" className="ch-form-label">
                    الاسم الكامل <span className="ch-form-required">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخلي اسمك الكامل"
                    required
                    autoComplete="name"
                    className="ch-form-input"
                  />
                </div>

                <div className="ch-form-field">
                  <label htmlFor="email" className="ch-form-label">
                    البريد الإلكتروني <span className="ch-form-required">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    autoComplete="email"
                    dir="ltr"
                    className="ch-form-input"
                  />
                </div>

                {!stats.isFull && stats.remainingSeats > 0 && (
                  <div className="ch-form-remaining">
                    متبقي <strong>{stats.remainingSeats}</strong> مقعد من أصل {stats.maxSeats}
                  </div>
                )}

                <button
                  type="submit"
                  className="ch-btn ch-btn-primary ch-btn-lg ch-btn-full"
                  disabled={!name.trim() || !email.trim()}
                >
                  <span className="ch-btn-text">
                    {stats.isFull ? '🔔 انضمّي لقائمة الانتظار' : '✨ أكّدي التسجيل'}
                  </span>
                  <span className="ch-btn-shine" aria-hidden="true" />
                </button>

                <p className="ch-form-micro">
                  🔒 بياناتك آمنة ولن نشاركها مع أي طرف ثالث
                </p>
              </form>
            )}

            {/* Loading State */}
            {modalState === 'loading' && (
              <div className="ch-modal-loading">
                <div className="ch-spinner" aria-hidden="true" />
                <p>جارٍ تسجيل بياناتك...</p>
              </div>
            )}

            {/* Success State */}
            {modalState === 'success' && (
              <div className="ch-modal-success">
                <div className="ch-modal-state-badge ch-modal-state-badge-success">
                  <span className="ch-modal-state-badge-icon">✓</span>
                  <span>تم تأكيد تسجيلك</span>
                </div>

                <p className="ch-success-message">
                  مبارك! تم تسجيلك في التحدي بنجاح. ستصلك رسالة على بريدك الإلكتروني تحتوي على
                  تفاصيل اللقاء ورابط الانضمام.
                </p>

                {registrationResult?.meetLink && (
                  <div className="ch-link-box">
                    <span className="ch-link-label">رابط الاجتماع:</span>
                    <div className="ch-link-input-wrap">
                      <input
                        type="text"
                        value={registrationResult.meetLink}
                        readOnly
                        className="ch-link-input"
                      />
                      <button
                        type="button"
                        className={`ch-copy-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <CheckIcon className="ch-copy-icon" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="ch-copy-icon" />
                            نسخ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {registrationResult?.registrationId && (
                  <p className="ch-registration-id">
                    رقم التسجيل: <code>{registrationResult.registrationId}</code>
                  </p>
                )}

                <button
                  type="button"
                  className="ch-btn ch-btn-secondary ch-btn-lg ch-btn-full"
                  onClick={handleClose}
                >
                  إغلاق
                </button>
              </div>
            )}

            {/* Waitlist State */}
            {modalState === 'waitlist' && (
              <div className="ch-modal-waitlist">
                <div className="ch-modal-state-badge ch-modal-state-badge-waitlist">
                  <span className="ch-modal-state-badge-icon">📋</span>
                  <span>في قائمة الانتظار</span>
                </div>

                <p className="ch-waitlist-message">
                  للأسف المقاعد اكتملت، لكن تمت إضافتك لقائمة الانتظار.
                  سنُبلّغك فور توفر مقعد أو عند فتح التسجيل للجولة القادمة.
                </p>

                {registrationResult?.registrationId && (
                  <p className="ch-registration-id">
                    رقم التسجيل: <code>{registrationResult.registrationId}</code>
                  </p>
                )}

                <button
                  type="button"
                  className="ch-btn ch-btn-secondary ch-btn-lg ch-btn-full"
                  onClick={handleClose}
                >
                  حسناً، فهمت
                </button>
              </div>
            )}

            {/* Error State */}
            {modalState === 'error' && (
              <div className="ch-modal-error">
                <div className="ch-modal-state-badge ch-modal-state-badge-error">
                  <span className="ch-modal-state-badge-icon">✗</span>
                  <span>خطأ في التسجيل</span>
                </div>

                <p className="ch-error-message">{errorMessage}</p>

                <button
                  type="button"
                  className="ch-btn ch-btn-primary ch-btn-lg ch-btn-full"
                  onClick={() => setModalState('form')}
                >
                  حاولي مرة أخرى
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
