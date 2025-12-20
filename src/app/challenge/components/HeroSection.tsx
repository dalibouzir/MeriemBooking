'use client'

import { useEffect, useRef, useState } from 'react'
import { useChallengeContext } from '../ChallengeContext'

interface HeroSectionProps {
  title: string
  subtitle: string
  description: string
}

// Animated number component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setDisplayValue(value)
      hasAnimated.current = true
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()
          
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.round(eased * value))
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration])

  return <span ref={ref}>{displayValue}</span>
}

export default function HeroSection({ title, subtitle, description }: HeroSectionProps) {
  const { stats, openModal, scrollToDetails } = useChallengeContext()
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.classList.add('is-revealed')
      return
    }

    const timer = setTimeout(() => el.classList.add('is-revealed'), 100)
    return () => clearTimeout(timer)
  }, [])

  const progressPercent = stats.maxSeats > 0 
    ? Math.min(((stats.maxSeats - stats.remainingSeats) / stats.maxSeats) * 100, 100)
    : 0

  return (
    <section ref={heroRef} className="ch-hero" aria-labelledby="hero-title">
      {/* Background decoration */}
      <div className="ch-hero-bg" aria-hidden="true">
        <div className="ch-hero-blob ch-hero-blob-1" />
        <div className="ch-hero-blob ch-hero-blob-2" />
        <div className="ch-hero-blob ch-hero-blob-3" />
        <div className="ch-hero-gradient" />
      </div>

      <div className="ch-hero-container">
        <div className="ch-hero-grid">
          {/* RIGHT Column - Main Content */}
          <div className="ch-hero-content">
            {/* Badges */}
            <div className="ch-hero-badges">
              <span className="ch-badge ch-badge-free">🎁 مجاني تماماً</span>
              <span className="ch-badge ch-badge-online">🌐 أونلاين</span>
              <span className="ch-badge ch-badge-limited">⏰ مقاعد محدودة</span>
            </div>

            {/* Title */}
            <h1 id="hero-title" className="ch-hero-title">
              {title || (
                <>انضمّي إلى <span className="ch-hero-title-accent">التحدّي المجاني</span></>
              )}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="ch-hero-subtitle">{subtitle}</p>
            )}

            {/* Description */}
            {description && (
              <p className="ch-hero-desc">{description}</p>
            )}

            {/* CTA Buttons */}
            <div className="ch-hero-cta">
              <button
                type="button"
                className="ch-btn ch-btn-primary ch-btn-xl"
                onClick={openModal}
                disabled={stats.isFull}
              >
                <span className="ch-btn-text">
                  {stats.isFull ? '🔔 انضمّي لقائمة الانتظار' : '✨ سجّلي الآن مجاناً'}
                </span>
                <span className="ch-btn-shine" aria-hidden="true" />
              </button>
              
              <button
                type="button"
                className="ch-btn ch-btn-secondary ch-btn-lg"
                onClick={scrollToDetails}
              >
                اكتشفي التفاصيل ↓
              </button>
            </div>

            <p className="ch-hero-micro">
              ⚡ التسجيل يستغرق أقل من 30 ثانية
            </p>
          </div>

          {/* LEFT Column - Stats Panel */}
          <div className="ch-hero-stats-panel">
            <div className="ch-stats-card">
              <div className="ch-stats-card-glow" aria-hidden="true" />
              
              <h2 className="ch-stats-title">📊 إحصائيات التحدي</h2>
              
              <div className="ch-stats-grid">
                {/* Confirmed */}
                <div className="ch-stat-item ch-stat-main">
                  <span className="ch-stat-icon" aria-hidden="true">👩‍👩‍👧</span>
                  <div>
                    <div className="ch-stat-value">
                      <AnimatedNumber value={stats.confirmedCount} />
                    </div>
                    <div className="ch-stat-label">مشتركة مؤكدة</div>
                  </div>
                </div>

                {/* Remaining */}
                <div className={`ch-stat-item ${stats.remainingSeats <= 5 ? 'ch-stat-urgent' : ''}`}>
                  {stats.remainingSeats <= 5 && stats.remainingSeats > 0 && (
                    <span className="ch-stat-badge">آخر الفرص!</span>
                  )}
                  <span className="ch-stat-icon" aria-hidden="true">🎯</span>
                  <div>
                    <div className="ch-stat-value">
                      <AnimatedNumber value={stats.remainingSeats} />
                    </div>
                    <div className="ch-stat-label">مقعد متبقي</div>
                  </div>
                </div>

                {/* Waitlist (if full) */}
                {stats.isFull && stats.waitlistCount > 0 && (
                  <div className="ch-stat-item ch-stat-waitlist">
                    <span className="ch-stat-icon" aria-hidden="true">⏳</span>
                    <div>
                      <div className="ch-stat-value">
                        <AnimatedNumber value={stats.waitlistCount} />
                      </div>
                      <div className="ch-stat-label">في قائمة الانتظار</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="ch-stats-progress">
                <div className="ch-progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div 
                    className="ch-progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div 
                    className="ch-progress-glow" 
                    style={{ left: `${progressPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="ch-progress-labels">
                  <span>{stats.confirmedCount} مسجلة</span>
                  <span>{stats.maxSeats} الحد الأقصى</span>
                </div>
              </div>

              {/* Warning message */}
              {stats.remainingSeats <= 10 && stats.remainingSeats > 0 && (
                <p className="ch-stats-warning">
                  ⚠️ المقاعد تنفذ بسرعة - سجّلي الآن!
                </p>
              )}

              {stats.isFull && (
                <p className="ch-stats-full">
                  اكتمل العدد! يمكنك الانضمام لقائمة الانتظار
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="ch-hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}
