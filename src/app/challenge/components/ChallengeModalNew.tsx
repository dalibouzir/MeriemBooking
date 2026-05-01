'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CheckCircleIcon,
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
  const [copied, setCopied] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'day1' | 'day2' | null>(null)

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

  const handleCopyLink = useCallback((link?: string | null, key: 'day1' | 'day2' = 'day1') => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setCopiedKey(key)
    setTimeout(() => {
      setCopied(false)
      setCopiedKey(null)
    }, 2000)
  }, [])

  const handleClose = useCallback(() => {
    closeModal()
    // Reset form after animation
    setTimeout(() => {
      setName('')
      setEmail('')
      setCopied(false)
      setCopiedKey(null)
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
      <div className="ch-modal-card" style={{ width: 'min(1120px, 100%)' }}>
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
                {modalState === 'form' && (stats.isFull ? '🔔 قائمة الانتظار' : '✨ احجزي مكانك الآن مجانًا')}
                {modalState === 'loading' && '⏳ جارٍ التسجيل...'}
                {modalState === 'success' && 'تم تسجيلك بنجاح 🎉'}
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
              <div className="ch-modal-success">
                <div className="ch-modal-state-badge ch-modal-state-badge-success">
                  <span className="ch-modal-state-badge-icon">✓</span>
                  <span>تم تأكيد تسجيلك</span>
                </div>

                <p className="ch-success-message">
                  هذه أول خطوة نحو هدوء حقيقي من الداخل.
                </p>

                <div
                  style={{
                    width: '100%',
                    borderRadius: '22px',
                    border: '1px solid var(--surface-border)',
                    background: 'linear-gradient(145deg, hsla(var(--glass-strong)), hsla(var(--glass)))',
                    padding: '18px',
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircleIcon style={{ width: 20, height: 20, color: '#10b981' }} />
                    <strong style={{ fontSize: '1rem', color: 'hsl(var(--text))' }}>تم تأكيد تسجيلك</strong>
                  </div>

                  {registrationResult?.startsAt && (
                    <>
                      <div className="ch-meeting-info">
                        <div className="ch-meeting-info-item">
                          <CalendarDaysIcon style={{ width: 20, height: 20, color: 'hsl(var(--primary-700))' }} />
                          <span className="ch-meeting-info-text">
                            {new Date(registrationResult.startsAt).toLocaleDateString('ar-u-nu-latn', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="ch-meeting-info-item">
                          <ClockIcon style={{ width: 20, height: 20, color: 'hsl(var(--primary-700))' }} />
                          <span className="ch-meeting-info-text">
                            {new Date(registrationResult.startsAt).toLocaleTimeString('ar-u-nu-latn', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                        {registrationResult.durationMinutes && (
                          <div className="ch-meeting-info-item">
                            <ClockIcon style={{ width: 20, height: 20, color: 'hsl(var(--primary-700))' }} />
                            <span className="ch-meeting-info-text">
                              {registrationResult.durationMinutes} دقيقة
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {(registrationResult?.day1MeetLink || registrationResult?.day2MeetLink || registrationResult?.meetLink) && (
                    <>
                      {[
                        { key: 'day1' as const, title: 'رابط اليوم الأول', link: registrationResult?.day1MeetLink || registrationResult?.meetLink },
                        { key: 'day2' as const, title: 'رابط اليوم الثاني', link: registrationResult?.day2MeetLink },
                      ].filter((item) => !!item.link).map((item) => (
                        <div key={item.key} className="ch-link-box">
                          <span className="ch-link-label">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <LinkIcon style={{ width: 16, height: 16 }} />
                              {item.title}
                            </span>
                          </span>
                          <div className="ch-link-input-wrap">
                            <input
                              type="text"
                              value={item.link || ''}
                              readOnly
                              className="ch-link-input"
                            />
                            <button
                              type="button"
                              className={`ch-copy-btn ${copied && copiedKey === item.key ? 'copied' : ''}`}
                              onClick={() => handleCopyLink(item.link, item.key)}
                            >
                              {copied && copiedKey === item.key ? (
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
                          <a
                            href={item.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ch-btn ch-btn-primary ch-btn-lg ch-btn-full"
                            style={{ marginTop: '12px', textDecoration: 'none' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18 }} />
                              {item.title}
                            </span>
                          </a>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div
                  style={{
                    width: '100%',
                    borderRadius: '24px',
                    padding: '20px',
                    border: '1px solid hsla(var(--primary) / 0.28)',
                    background:
                      'linear-gradient(135deg, hsla(var(--primary) / 0.15), hsla(var(--accent) / 0.12) 55%, hsla(var(--bg) / 0.72))',
                    boxShadow: '0 12px 30px hsla(var(--primary) / 0.16)',
                    display: 'grid',
                    gap: '12px',
                    textAlign: 'right',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 800, color: 'hsl(var(--primary-700))', fontSize: '0.95rem' }}>
                    💜 VIP DAY
                  </p>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'hsl(var(--text))' }}>
                    جلسة تطبيق مباشرة على حالتك أنتِ
                  </h3>
                  <p style={{ margin: 0, color: 'hsl(var(--text-dim))', lineHeight: 1.75 }}>
                    إذا شعرتِ أن هذا التحدي يشبهك، لا تكتفي بالفهم فقط. في يوم الـ VIP نأخذ حالات حقيقية من الأمهات
                    ونطبّق عليها خطوة بخطوة.
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {[
                      'تحليل حالتك أنتِ',
                      'إجابة مباشرة على أسئلتك',
                      'تطبيق عملي على واقعك',
                      'تسجيلات الأيام الثلاثة',
                    ].map((item) => (
                      <div
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 14,
                          background: 'hsla(var(--bg) / 0.55)',
                          border: '1px solid hsla(var(--primary) / 0.2)',
                        }}
                      >
                        <SparklesIcon style={{ width: 16, height: 16, color: 'hsl(var(--primary-700))', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.92rem', color: 'hsl(var(--text))' }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      borderRadius: 16,
                      padding: '12px 14px',
                      background: 'hsla(var(--bg) / 0.64)',
                      border: '1px dashed hsla(var(--primary) / 0.35)',
                      display: 'grid',
                      gap: 4,
                    }}
                  >
                    <p style={{ margin: 0, color: 'hsl(var(--text-dim))', fontWeight: 700 }}>المجاني: فهم ووعي</p>
                    <p style={{ margin: 0, color: 'hsl(var(--primary-700))', fontWeight: 800 }}>VIP: فهم + تطبيق عليكِ أنتِ</p>
                  </div>

                  {/* TODO: Create /vip offer/payment page content */}
                  <a
                    href="/vip"
                    className="ch-btn ch-btn-lg ch-btn-full"
                    style={{
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 45%, #ec4899 100%)',
                      color: '#fff',
                      boxShadow: '0 12px 24px rgba(124,58,237,0.32)',
                    }}
                  >
                    أريد معرفة تفاصيل VIP ✨
                  </a>

                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'hsl(var(--text-subtle))',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 4,
                      padding: 0,
                    }}
                  >
                    سأكتفي بالتحدي المجاني الآن
                  </button>
                </div>

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
