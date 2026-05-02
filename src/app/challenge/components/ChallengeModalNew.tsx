'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useChallengeContext } from '../ChallengeContext'
import { registerChallengeAction, getChallengeStatsAction } from '../actions'
import { trackLead } from '@/lib/meta/lead'

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

      if (result.status === 'success' || result.status === 'already_registered') {
        setRegistrationResult({
          registrationId: result.registration_id,
          meetLink: result.day1_zoom_url || result.meeting_url,
          day1MeetLink: result.day1_zoom_url || result.meeting_url,
          day2MeetLink: result.day2_zoom_url || null,
          startsAt: result.starts_at,
          durationMinutes: result.duration_minutes,
        })
        setModalState('success')
        
        // Track Lead event ONLY on successful registration
        trackLead({
          email: email.trim(),
          contentName: 'fitness_challenge',
          formName: 'challenge_modal',
          leadType: 'challenge_registration',
        }).catch(() => {
          // best-effort; ignore failures
        })
      } else if (result.status === 'full') {
        // Registered to waitlist
        setRegistrationResult({
          registrationId: result.registration_id,
        })
        setModalState('waitlist')
        
        // Also track waitlist as Lead (still valuable)
        trackLead({
          email: email.trim(),
          contentName: 'fitness_challenge_waitlist',
          formName: 'challenge_modal',
          leadType: 'challenge_waitlist',
        }).catch(() => {
          // best-effort; ignore failures
        })
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

  const handleClose = useCallback(() => {
    closeModal()
    // Reset form after animation
    setTimeout(() => {
      setName('')
      setEmail('')
    }, 300)
  }, [closeModal])

  if (modalState === 'closed') return null

  const modalTitle =
    (modalState === 'form' && (stats.isFull ? '🔔 قائمة الانتظار' : '✨ احجزي مكانك الآن مجانًا')) ||
    (modalState === 'loading' && '⏳ جارٍ التسجيل...') ||
    (modalState === 'success' && '') ||
    (modalState === 'waitlist' && '📋 تمت إضافتك لقائمة الانتظار') ||
    (modalState === 'error' && '❌ حدث خطأ') ||
    ''

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
      <div className={`ch-modal-card ${modalState === 'success' ? 'is-success' : ''}`} style={{ width: 'min(980px, 100%)' }}>
        {/* Decorative blobs */}
        <div className="ch-modal-decor" aria-hidden="true">
          <div className="ch-modal-blob ch-modal-blob-1" />
          <div className="ch-modal-blob ch-modal-blob-2" />
        </div>

        <div className="ch-modal-inner">
          {/* Header */}
          <div className="ch-modal-header">
            <div className="ch-modal-header-content">
              {modalTitle ? (
                <h2 id="modal-title" className="ch-modal-title">
                  {modalTitle}
                </h2>
              ) : null}
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

                <button
                  type="submit"
                  className="ch-btn ch-btn-primary ch-btn-lg ch-btn-full"
                  disabled={!name.trim() || !email.trim()}
                >
                  <span className="ch-btn-text">
                    {stats.isFull ? '🔔 انضمّي لقائمة الانتظار' : '✨ تأكيد الحجز المجاني'}
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
              <div className="ch-modal-success ch-modal-success-vip">
                <div className="ch-vip-congrats">
                  <p className="ch-vip-congrats-title">🎉مبروك! تم تسجيلك في التحدي</p>
                  <p className="ch-vip-congrats-note">
                    📩 كل التفاصيل ستصلك عبر الإيميل
                    <br />
                    (تفقدي البريد + Spam)
                  </p>
                </div>

                <section className="ch-vip-offer-card" aria-label="VIP offer">
                  <div className="ch-vip-offer-copy">
                    <div className="ch-vip-divider" aria-hidden="true" />
                    <p className="ch-vip-offer-kicker">لكن قبل أن تغادري… عندي لك فرصة لا تتكرر 👇</p>
                    <div className="ch-vip-divider" aria-hidden="true" />

                    <div className="ch-vip-offer-grid">
                      <div className="ch-vip-offer-main">
                        <h3 className="ch-vip-offer-title">💜 عرض VIP</h3>
                        <p className="ch-vip-offer-subtitle">✨ لا تضيّعي أقوى جزء في هذا التحدي</p>
                        <p className="ch-vip-offer-day">اليوم الثالث (VIP):</p>

                        <ul className="ch-vip-offer-points">
                          <li>تحليل حالتك أنتِ</li>
                          <li>إجابة مباشرة على أسئلتك</li>
                          <li>تطبيق عملي على واقعك</li>
                        </ul>
                      </div>

                      <div className="ch-vip-offer-side">
                        <p className="ch-vip-offer-section-title">💰 السعر</p>
                        <p className="ch-vip-offer-old-price">بدل 29€</p>
                        <p className="ch-vip-offer-main-price">🔥 اليوم فقط: 9€</p>
                        <p className="ch-vip-offer-tn-price">🇹🇳 لتونس: 19 دينار</p>

                        <div className="ch-vip-divider" aria-hidden="true" />
                        <p className="ch-vip-offer-section-title">⏳ الإلحاح</p>
                        <div className="ch-vip-offer-urgency">
                          <p>⚠️ الأماكن محدودة</p>
                          <p>وبعد امتلاء المجموعة يرجع السعر لـ 29€</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <a
                    href="/booking?offer=challenge-vip"
                    className="ch-vip-offer-cta"
                  >
                    👉 احجزي مكانك الآن
                  </a>
                </section>

                {registrationResult?.registrationId && (
                  <p className="ch-registration-id">
                    رقم التسجيل: <code>{registrationResult.registrationId}</code>
                  </p>
                )}

                <button type="button" className="ch-vip-later-link" onClick={handleClose}>لاحقًا</button>
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
                  المقاعد اكتملت حاليًا، وتمت إضافتك إلى قائمة الانتظار.
                  سنُبلغك فور توفر مقعد أو عند فتح الجولة القادمة.
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
