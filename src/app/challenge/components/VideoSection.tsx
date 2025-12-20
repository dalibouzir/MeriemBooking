'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

export default function VideoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  // Auto-play by default (like success page)
  const [isPlaying, setIsPlaying] = useState(true)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('is-revealed')
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // YouTube video ID - replace with your actual video
  const videoId = 'dQw4w9WgXcQ'
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  const embedSrc = useMemo(() => {
    const url = new URL(`https://www.youtube.com/embed/${videoId}`)
    url.searchParams.set('autoplay', '1')
    url.searchParams.set('mute', '0')
    url.searchParams.set('rel', '0')
    url.searchParams.set('playsinline', '1')
    url.searchParams.set('enablejsapi', '1')
    if (origin) {
      url.searchParams.set('origin', origin)
    }
    return url.toString()
  }, [origin, videoId])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <section ref={sectionRef} className="ch-video-section ch-reveal" aria-labelledby="video-title">
      <div className="ch-video-container">
        <div className="ch-video-header">
          <h2 id="video-title" className="ch-section-title">
            🎬 شاهدي الفيديو التعريفي
          </h2>
          <p className="ch-section-subtitle">
            تعرّفي على تفاصيل التحدي وما الذي ستتعلمينه خلال هذه الرحلة المميزة
          </p>
        </div>

        <div className="ch-video-card">
          <div className="ch-video-card-glow" aria-hidden="true" />
          <div className="ch-video-wrapper">
            {isPlaying ? (
              <iframe
                id="challenge-video-player"
                src={embedSrc}
                title="فيديو تعريفي عن التحدي"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button 
                type="button"
                className="ch-video-thumbnail"
                onClick={handlePlay}
                aria-label="تشغيل الفيديو"
              >
                <img 
                  src={thumbnailUrl} 
                  alt="صورة مصغرة للفيديو"
                  className="ch-video-thumbnail-img"
                />
                <div className="ch-video-play-btn">
                  <svg viewBox="0 0 68 48" className="ch-video-play-icon">
                    <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
                    <path d="M 45,24 27,14 27,34" fill="#fff"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
