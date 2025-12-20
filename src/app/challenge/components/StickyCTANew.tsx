'use client'

import { useEffect, useState } from 'react'
import { useChallengeContext } from '../ChallengeContext'

export default function StickyCTANew() {
  const { stats, openModal } = useChallengeContext()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (approximately 500px)
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className={`ch-sticky-cta ${isVisible ? 'is-visible' : ''}`}
      role="complementary"
      aria-label="التسجيل السريع"
    >
      <div className="ch-sticky-cta-content">
        <div className="ch-sticky-cta-info">
          <span className="ch-sticky-cta-pulse" aria-hidden="true" />
          <span className="ch-sticky-cta-text">
            {stats.isFull ? (
              <>قائمة الانتظار مفتوحة</>
            ) : stats.remainingSeats <= 5 ? (
              <>
                <strong className="ch-sticky-cta-urgent">{stats.remainingSeats}</strong> مقاعد متبقية فقط!
              </>
            ) : (
              <>
                <strong>{stats.remainingSeats}</strong> مقعد متبقي
              </>
            )}
          </span>
        </div>

        <button
          type="button"
          className="ch-btn ch-btn-primary ch-btn-sticky"
          onClick={openModal}
        >
          {stats.isFull ? 'قائمة الانتظار' : 'سجّلي الآن'}
        </button>
      </div>
    </div>
  )
}
