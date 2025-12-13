'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'next/navigation'

type Locale = 'ar' | 'en'

type VideoInfo = {
  embedUrl: string | null
  provider: 'youtube' | 'drive' | 'unknown'
}

const ENV_DEFAULT_VIDEO_URL = (process.env.NEXT_PUBLIC_SUCCESS_VIDEO_URL || '').trim()
const ENV_DEFAULT_CALL_URL = (process.env.NEXT_PUBLIC_SUCCESS_CALL_BOOKING_URL || '').trim()
const ENV_DEFAULT_SUPPORT_TEXT = (process.env.NEXT_PUBLIC_SUCCESS_SUPPORT_TEXT || '').trim()
const ENV_DEFAULT_CTA_LABEL = (process.env.NEXT_PUBLIC_SUCCESS_CTA_LABEL || '').trim()
const DEFAULT_FALLBACK_VIDEO_URL =
  'https://www.youtube-nocookie.com/embed/zBJDNj477Zg?si=dGAt5QysJ6hmUbTI&start=1'
const VIDEO_PROGRESS_KEY = 'success-video-progress'

const DEFAULTS: Record<Locale, {
  banner: string
  watchCta: string
  watchHint: string
  videoPrompt: string
  ctaLabel: string
  support: string
}> = {
  ar: {
    banner: 'مبروك! سيصلك الملف وجميع الروابط عبر الإيميل والواتساب خلال دقائق.',
    watchCta: 'شغّلي الفيديو',
    watchHint: 'شغّلي الفيديو مع الصوت',
    videoPrompt: 'شاهِدِي هذا الفيديو الآن لتكتشفي كيف تبدئين من اليوم طريقك نحو أهدافك كأمّ',
    ctaLabel: 'احجزي مكالمتك المجانية',
    support: 'فريق الدعم حاضر لتأكيد موعدك أو المساعدة في أي استفسار حول التنزيل.',
  },
  en: {
    banner: 'Awesome! Everything you need is coming via email and WhatsApp within minutes.',
    watchCta: 'Play video',
    watchHint: 'Click to turn on sound',
    videoPrompt: 'Watch this video now to discover how to begin moving toward your goals today',
    ctaLabel: 'Book your free call',
    support: 'Our team is ready to confirm your slot or help if anything looks unclear.',
  }
}

export default function SuccessClient() {
  const searchParams = useSearchParams()

  const locale: Locale = useMemo(() => (searchParams.get('locale') === 'en' ? 'en' : 'ar'), [searchParams])
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const defaults = DEFAULTS[locale]

  const customerName = searchParams.get('customerName')?.trim() || ''
  const videoUrlParam = searchParams.get('videoUrl')?.trim() || ''
  const videoUrl = videoUrlParam || ENV_DEFAULT_VIDEO_URL || DEFAULT_FALLBACK_VIDEO_URL
  const callBookingUrl = searchParams.get('callBookingUrl')?.trim() || ENV_DEFAULT_CALL_URL || ''
  const supportText = searchParams.get('supportText')?.trim() || ENV_DEFAULT_SUPPORT_TEXT || defaults.support
  const ctaLabel = searchParams.get('ctaLabel')?.trim() || ENV_DEFAULT_CTA_LABEL || defaults.ctaLabel

  const bannerMessage = useMemo(() => {
    if (!customerName) return defaults.banner
    return locale === 'ar'
      ? `مبروك يا ${customerName}! سيصلك الملف عبر الإيميل والواتساب خلال دقائق.`
      : `Congrats ${customerName}! Your downloads are on their way via email and WhatsApp.`
  }, [customerName, defaults.banner, locale])

  const DEFAULT_CALENDLY_URL = 'https://calendly.com/meriembouzir/30min?month=2025-12'
  const bookingHref = callBookingUrl || DEFAULT_CALENDLY_URL

  const videoInfo = useMemo<VideoInfo>(() => parseVideoUrl(videoUrl), [videoUrl])

  const [resumeStart, setResumeStart] = useState(() => {
    if (typeof window === 'undefined' || !videoInfo.embedUrl) return 0
    try {
      const stored = window.sessionStorage.getItem(VIDEO_PROGRESS_KEY)
      if (!stored) return 0
      const parsed = JSON.parse(stored)
      if (parsed?.url === videoInfo.embedUrl && typeof parsed.time === 'number') {
        return Math.max(0, Math.floor(parsed.time))
      }
    } catch {
      return 0
    }
    return 0
  })
  const [isBannerVisible, setBannerVisible] = useState(true)
  const [isPlaying, setPlaying] = useState(() => Boolean(videoInfo.embedUrl))
  const [origin, setOrigin] = useState('')

  const handlePlay = () => {
    if (!videoInfo.embedUrl) return
    setPlaying(true)
  }

  const embedSrc = useMemo(() => {
    if (!videoInfo.embedUrl) return ''
    const url = new URL(videoInfo.embedUrl)
    if (resumeStart > 0) {
      url.searchParams.set('start', `${Math.floor(resumeStart)}`)
    }
    url.searchParams.set('autoplay', '1')
    url.searchParams.set('mute', '0')
    url.searchParams.set('rel', '0')
    url.searchParams.set('playsinline', '1')
    if (videoInfo.provider === 'youtube') {
      if (origin) {
        url.searchParams.set('origin', origin)
      }
      url.searchParams.set('enablejsapi', '1')
    }
    return url.toString()
  }, [origin, resumeStart, videoInfo.embedUrl, videoInfo.provider])

  useEffect(() => {
    if (videoInfo.embedUrl) {
      setPlaying(true)
    }
  }, [videoInfo.embedUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.success-shell .appear-on-scroll')
    )
    if (!elements.length) return

    const revealAll = () => elements.forEach((el) => el.classList.add('is-visible'))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!videoInfo.embedUrl) {
      setResumeStart(0)
      return
    }
    try {
      const stored = window.sessionStorage.getItem(VIDEO_PROGRESS_KEY)
      if (!stored) {
        setResumeStart(0)
        return
      }
      const parsed = JSON.parse(stored)
      const time = parsed?.url === videoInfo.embedUrl ? Number(parsed.time) : 0
      setResumeStart(Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0)
    } catch {
      setResumeStart(0)
    }
  }, [videoInfo.embedUrl])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      videoInfo.provider !== 'youtube' ||
      !videoInfo.embedUrl ||
      !document.getElementById('success-video-player')
    ) {
      return
    }

    const w = window as typeof window & {
      YT?: any
      onYouTubeIframeAPIReady?: () => void
    }

    let player: any = null
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const saveProgress = (seconds: number) => {
      if (!videoInfo.embedUrl || Number.isNaN(seconds)) return
      try {
        w.sessionStorage.setItem(
          VIDEO_PROGRESS_KEY,
          JSON.stringify({ url: videoInfo.embedUrl, time: Math.max(0, Math.floor(seconds)) })
        )
      } catch {
        /* ignore storage write issues */
      }
    }

    const stopTracking = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const startTracking = () => {
      if (interval || !player?.getCurrentTime) return
      interval = setInterval(() => {
        const current = player?.getCurrentTime?.()
        if (typeof current === 'number') {
          saveProgress(current)
        }
      }, 1500)
    }

    const handleReady = (event: any) => {
      if (resumeStart > 1 && event?.target?.seekTo) {
        event.target.seekTo(resumeStart, true)
      }
      event?.target?.playVideo?.()
      startTracking()
    }

    const captureProgress = (_evt?: Event) => {
      const current = player?.getCurrentTime?.()
      if (typeof current === 'number') {
        saveProgress(current)
      }
    }

    const handleStateChange = (event: any) => {
      if (!w.YT || !event) return
      const state = event.data
      if (state === w.YT.PlayerState.PLAYING) {
        startTracking()
      }
      if (state === w.YT.PlayerState.PAUSED) {
        const current = event.target?.getCurrentTime?.()
        if (typeof current === 'number') saveProgress(current)
        stopTracking()
      }
      if (state === w.YT.PlayerState.ENDED) {
        saveProgress(0)
        stopTracking()
      }
    }

    const setupPlayer = () => {
      if (cancelled) return
      if (player) return
      if (!w.YT?.Player) return
      player = new w.YT.Player('success-video-player', {
        events: {
          onReady: handleReady,
          onStateChange: handleStateChange,
        },
      })
    }

    if (w.YT?.Player) {
      setupPlayer()
    } else {
      const previousReady = w.onYouTubeIframeAPIReady
      w.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        setupPlayer()
      }

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true
        document.body.appendChild(tag)
      }
    }

    document.addEventListener('visibilitychange', captureProgress, { passive: true })
    w.addEventListener('pagehide', captureProgress)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', captureProgress)
      w.removeEventListener('pagehide', captureProgress)
      if (player?.destroy) {
        const current = player?.getCurrentTime?.()
        if (typeof current === 'number') {
          saveProgress(current)
        }
        player.destroy()
      }
      stopTracking()
    }
  }, [resumeStart, videoInfo.embedUrl, videoInfo.provider])

  return (
    <main className={`success-shell ${locale}`} dir={dir} lang={locale}>
      {isBannerVisible && (
        <div
          className="success-banner appear-on-scroll"
          style={{ '--delay': '0.05s' } as CSSProperties}
          role="status"
        >
          <div className="banner-text">{bannerMessage}</div>
          <button
            type="button"
            className="banner-dismiss"
            onClick={() => setBannerVisible(false)}
            aria-label={locale === 'ar' ? 'إخفاء التنبيه' : 'Dismiss message'}
          >
            ×
          </button>
        </div>
      )}

      <section
        className="success-card glass-water polished appear-on-scroll"
        style={{ '--delay': '0.08s' } as CSSProperties}
        aria-labelledby="success-heading"
      >
        <header className="success-header appear-on-scroll" style={{ '--delay': '0.12s' } as CSSProperties}>
          <h1 id="success-heading" className="success-heading-text">
            {defaults.videoPrompt}
          </h1>
          <p className="success-heading-note">
            {defaults.watchHint}
          </p>
        </header>

        <div className="cta-block appear-on-scroll" style={{ '--delay': '0.18s' } as CSSProperties}>
          <button
            type="button"
            className="cta-booking"
            onClick={() => {
              if (!bookingHref || typeof window === 'undefined') return
              window.open(bookingHref, '_blank', 'noopener,noreferrer')
            }}
            aria-label={ctaLabel}
          >
            {ctaLabel}
          </button>
          <p className="free-note">
            {locale === 'ar'
              ? 'احجزي مكالمتك المجانية مباشرة عبر Calendly وسيصلك تأكيد الموعد فوراً.'
              : 'Book your complimentary call directly via Calendly and receive an instant confirmation.'}
          </p>
        </div>

        <div className="video-block appear-on-scroll" style={{ '--delay': '0.24s' } as CSSProperties}>
          {isPlaying && videoInfo.embedUrl ? (
            <div className="video-embed" role="region" aria-label={locale === 'ar' ? 'مشغل الفيديو' : 'Video player'}>
              <iframe
                id="success-video-player"
                src={embedSrc}
                title={locale === 'ar' ? 'تشغيل الفيديو' : 'Play video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <button
              type="button"
              className="video-poster"
              onClick={handlePlay}
              disabled={!videoInfo.embedUrl}
              aria-label={videoInfo.embedUrl ? defaults.watchHint : locale === 'ar' ? 'رابط الفيديو غير متاح' : 'Video link unavailable'}
            >
              <div className="poster-content">
                <span className="play-icon" aria-hidden>
                  ▶
                </span>
                <span className="poster-text">{defaults.watchCta}</span>
                <span className="poster-hint">{defaults.watchHint}</span>
              </div>
            </button>
          )}
          {!videoInfo.embedUrl && (
            <p className="video-fallback" role="alert">
              {locale === 'ar'
                ? 'لم نتمكن من تحميل الفيديو. تأكدي من صحة الرابط أو تواصلي مع الدعم.'
                : 'We could not load the video. Double‑check the link or reach out to support.'}
            </p>
          )}
        </div>

        <footer className="success-footer appear-on-scroll" style={{ '--delay': '0.3s' } as CSSProperties}>
          <p>{supportText}</p>
        </footer>
      </section>

      <style jsx>{`
        .success-shell {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2.5rem) 3rem;
          background:
            radial-gradient(58% 50% at 80% 6%, hsl(var(--accent) / 0.28), transparent 74%),
            radial-gradient(54% 46% at 20% 96%, hsl(var(--secondary) / 0.24), transparent 72%),
            linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--bg)) 48%, hsl(var(--surface-muted)) 100%);
          color: hsl(var(--text));
          transition: background 0.4s ease;
        }

        .success-shell::before,
        .success-shell::after {
          content: '';
          position: absolute;
          inset: -32% -24%;
          pointer-events: none;
          background: radial-gradient(48% 48% at 26% 32%, hsl(var(--surface-strong) / 0.55), transparent 76%);
          opacity: 0.42;
        }

        .success-shell::after {
          inset: -28% -26%;
          background: radial-gradient(48% 48% at 70% 72%, hsl(var(--accent) / 0.22), transparent 78%);
          opacity: 0.3;
        }

        .success-shell.en {
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .success-banner {
          width: min(960px, 100%);
          background: linear-gradient(90deg, hsl(var(--primary-700)), hsl(var(--accent)));
          color: var(--white);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-1);
          padding: var(--sp-4) var(--sp-5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--sp-4);
          margin-bottom: var(--sp-5);
        }

        .banner-text {
          font-weight: 700;
          font-size: 1rem;
        }

        .banner-dismiss {
          border: none;
          background: hsla(0 0% 100% / 0.22);
          color: inherit;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 1.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .banner-dismiss:hover {
          background: hsla(0 0% 100% / 0.35);
          transform: translateY(-1px);
        }

        .success-card {
          width: min(1100px, 100%);
          background: hsla(var(--glass-strong));
          border: 1px solid var(--surface-border);
          border-radius: clamp(var(--r-md), 5vw, var(--r-xl));
          box-shadow: var(--shadow-2);
          backdrop-filter: blur(var(--blur)) saturate(180%);
          -webkit-backdrop-filter: blur(var(--blur)) saturate(180%);
          padding: clamp(1.75rem, 4vw, 3rem);
          display: flex;
          flex-direction: column;
          gap: clamp(1.75rem, 4vw, 2.5rem);
        }

        .success-header {
          width: 100%;
          max-width: min(1080px, 100%);
          margin: 0 auto;
          text-align: center;
          display: grid;
          gap: var(--sp-2);
          padding: 0 clamp(0.75rem, 3vw, 1.5rem);
        }

        .success-heading-text {
          margin: 0 auto;
          font-size: clamp(2.1rem, 5vw, 3.1rem);
          font-weight: 900;
          color: hsl(var(--text));
          text-shadow: 1px 1px 2px hsl(var(--text-subtle) / 0.18);
          line-height: 1.2;
          letter-spacing: 0.25px;
          max-width: min(1080px, 100%);
        }

        .success-heading-note {
          margin: 0 auto;
          font-size: clamp(1rem, 2.9vw, 1.2rem);
          font-weight: 600;
          color: hsl(var(--text-dim));
          line-height: 1.5;
          max-width: min(900px, 100%);
        }

        .video-block {
          display: grid;
          gap: var(--sp-3);
        }

        .video-teaser-cta {
          width: min(420px, 100%);
          padding: 0.9rem 1rem;
          border-radius: clamp(var(--r-sm), 4vw, var(--r-lg));
          font-weight: 800;
          font-size: clamp(1rem, 3vw, 1.2rem);
          letter-spacing: 0.5px;
          border: none;
          background: hsl(var(--surface));
          color: hsl(var(--text));
          box-shadow: 0 12px 30px hsla(var(--primary-700) / 0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .video-teaser-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px hsla(var(--primary-700) / 0.2);
        }

        :global(.theme-d1) .video-teaser-cta,
        :global(.theme-d2) .video-teaser-cta,
        :global(.theme-d3) .video-teaser-cta,
        :global(.theme-d4) .video-teaser-cta {
          background: #111;
          color: #fff;
          box-shadow: 0 18px 40px hsla(0 0% 0% / 0.45);
        }


        .video-poster {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: clamp(var(--r-md), 4vw, var(--r-xl));
          border: 1px solid rgba(255,255,255,0.4);
          background:
            linear-gradient(135deg, rgba(126,34,206,0.65), rgba(168,85,247,0.45)),
            url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80') center/cover;
          box-shadow: var(--glass-shadow-2);
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          color: var(--white);
        }

        .video-poster:disabled {
          cursor: not-allowed;
          filter: grayscale(0.3);
          opacity: 0.7;
        }

        .video-poster:not(:disabled):hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 24px 60px rgba(124,58,237,.22);
        }

        .poster-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--sp-3);
          text-align: center;
          padding: var(--sp-5);
          background: linear-gradient(0deg, rgba(32,26,45,0.7), rgba(32,26,45,0.25));
        }

        .play-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          font-weight: 700;
          color: inherit;
          text-indent: 6px;
        }

        .poster-text {
          font-size: clamp(1.1rem, 2.8vw, 1.4rem);
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .poster-hint {
          font-size: 0.95rem;
          font-weight: 600;
          background: rgba(255,255,255,0.16);
          border-radius: 999px;
          padding: .35rem .85rem;
        }

        .video-embed {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: clamp(var(--r-md), 4vw, var(--r-xl));
          overflow: hidden;
          box-shadow: var(--glass-shadow-2);
          border: 1px solid rgba(255,255,255,0.4);
        }

        .video-embed iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .video-fallback {
          font-size: 0.95rem;
          color: var(--danger);
          font-weight: 600;
        }

        .cta-block {
          display: grid;
          gap: var(--sp-3);
          justify-items: center;
          text-align: center;
        }

        .cta-booking {
          min-height: 53px;
          min-width: 166px;
          width: min(420px, 100%);
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -ms-flex-pack: distribute;
          justify-content: space-around;
          position: relative;
          cursor: pointer;
          background:
            linear-gradient(120deg, #5d3fd3, #a855f7 60%, #ec4899 95%),
            linear-gradient(
              90deg,
              rgba(92, 33, 177, 0.8) -10%,
              rgba(123, 63, 191, 0.85) 55%,
              rgba(214, 48, 117, 0.65) 90%
            );
          border: 2px solid #c084fc;
          border-radius: 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 20px 40px rgba(90, 41, 165, 0.55);
        }

        .cta-booking:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 26px 50px hsla(var(--primary-700) / 0.45);
        }

        .cta-booking:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cta-booking::before {
          content: '';
          width: 4px;
          height: 28px;
          background: #19173b;
          border: 2px solid #d8b4fe;
          -webkit-transform: rotate(-45deg);
          -ms-transform: rotate(-45deg);
          transform: rotate(-45deg);
          position: absolute;
          border-top: 0;
          border-left: 0;
          border-bottom: 0;
          bottom: -7px;
          left: 4px;
          border-bottom-left-radius: 10px;
          border-top-left-radius: 10px;
          pointer-events: none;
        }

        .cta-booking::after {
          content: '';
          position: absolute;
          left: -2px;
          bottom: -2px;
          border-top: 15px solid transparent;
          border-left: 15px solid #fce7ff;
          pointer-events: none;
        }

        .free-note {
          font-size: 0.95rem;
          color: hsl(var(--text-dim));
          line-height: 1.6;
          max-width: min(440px, 100%);
          margin: 0;
        }

        .success-footer {
          background: hsla(var(--glass));
          border-radius: clamp(var(--r-sm), 3vw, var(--r-lg));
          border: 1px solid var(--surface-border);
          padding: 1rem 1.25rem;
          box-shadow: inset 0 1px 0 hsla(0 0% 100% / 0.2);
        }

        .success-footer p {
          font-size: 0.98rem;
          color: hsl(var(--text-dim));
          line-height: 1.7;
        }

        @media (min-width: 768px) {
          .success-card {
            padding: clamp(2.25rem, 4vw, 3.5rem);
          }

          .cta-button {
            width: min(480px, 100%);
          }
        }

        @media (min-width: 960px) {
          .success-card {
            gap: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .success-card {
            width: 100%;
            padding: clamp(1.5rem, 5vw, 2.1rem);
            gap: clamp(1.5rem, 4vw, 2rem);
          }

          .video-embed,
          .video-poster {
            min-height: 240px;
            aspect-ratio: 16 / 9;
          }
        }
      `}</style>
      <style jsx>{`
        :global(.appear-on-scroll){
          opacity:0;
          transform: translateY(22px);
          transition: opacity .45s ease, transform .45s ease;
        }
        :global(.appear-on-scroll.is-visible){
          opacity:1;
          transform: translateY(0);
          animation: fade-up 0.85s ease forwards;
          animation-delay: var(--delay, 0s);
        }
        @media (prefers-reduced-motion: reduce){
          :global(.appear-on-scroll),
          :global(.appear-on-scroll.is-visible){
            opacity:1;
            transform:none;
            animation:none !important;
          }
        }

        :global(.success-shell) {
          background:
            radial-gradient(58% 50% at 80% 6%, hsl(var(--accent) / 0.28), transparent 74%),
            radial-gradient(55% 48% at 20% 96%, hsl(var(--secondary) / 0.24), transparent 72%),
            linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--bg)) 50%, hsl(var(--surface-muted)) 100%);
          color: hsl(var(--text));
        }

        :global(.success-shell::before),
        :global(.success-shell::after) {
          background: radial-gradient(48% 48% at 26% 32%, hsl(var(--surface-strong) / 0.55), transparent 76%);
        }

        :global(.success-shell::after) {
          background: radial-gradient(48% 48% at 70% 72%, hsl(var(--accent) / 0.22), transparent 78%);
        }

        :global(.success-card) {
          background: hsla(var(--glass-strong));
          border: 1px solid var(--surface-border);
          box-shadow: var(--shadow-2);
        }

        :global(.success-heading-text) {
          color: hsl(var(--text));
          text-shadow: 1px 1px 2px hsl(var(--text-subtle) / 0.18);
        }

        :global(.success-banner) {
          background: linear-gradient(90deg, hsl(var(--primary-700)), hsl(var(--accent)));
          box-shadow: var(--shadow-1);
          color: var(--white);
        }

        :global(.banner-dismiss) {
          background: hsla(0 0% 100% / 0.22);
        }

        :global(.banner-dismiss:hover) {
          background: hsla(0 0% 100% / 0.35);
        }

        :global(.video-poster) {
          background:
            radial-gradient(65% 80% at 70% 30%, hsla(var(--glass)), transparent),
            linear-gradient(140deg, hsl(var(--primary) / 0.22), hsl(var(--accent) / 0.14));
          border: 1px solid var(--surface-border);
          color: hsl(var(--text));
          box-shadow: var(--shadow-1);
        }

        :global(.video-poster:not(:disabled):hover) {
          box-shadow: var(--shadow-2);
        }

        :global(.play-icon) {
          color: hsl(var(--primary-600));
        }

        :global(.poster-hint) {
          color: hsl(var(--text-dim));
        }

        :global(.video-fallback) {
          color: var(--danger);
        }

        :global(.cta-button) {
          box-shadow: 0 24px 55px hsl(var(--primary-700) / 0.38);
        }

        :global(.cta-button:hover) {
          box-shadow: 0 28px 70px hsl(var(--primary-700) / 0.42);
        }

        :global(.free-note) {
          color: hsl(var(--text-dim));
        }

        :global(.success-footer) {
          color: hsl(var(--text-dim));
        }
      `}</style>
    </main>
  )
}

function parseVideoUrl(raw: string): VideoInfo {
  if (!raw) return { embedUrl: null, provider: 'unknown' }
  try {
    const url = new URL(raw)
    const host = url.hostname.replace(/^www\./, '')
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const isYouTubeHost = host === 'youtube-nocookie.com' || host === 'youtu.be' || host.endsWith('youtube.com')

    const applyTimeParams = (target: URL) => {
      const start = url.searchParams.get('start') || url.searchParams.get('t')
      if (start) {
        const startDigits = start.match(/\d+/g)?.join('')
        if (startDigits) {
          target.searchParams.set('start', startDigits)
        }
      }
      const siParam = url.searchParams.get('si')
      if (siParam) {
        target.searchParams.set('si', siParam)
      }
    }

    if (isYouTubeHost) {
      const embedIndex = pathSegments.findIndex((part) => part === 'embed')
      if (embedIndex > -1 && pathSegments[embedIndex + 1]) {
        const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${pathSegments[embedIndex + 1]}`)
        applyTimeParams(embedUrl)
        return { embedUrl: embedUrl.toString(), provider: 'youtube' }
      }

      let videoId = ''

      if (host === 'youtu.be') {
        videoId = pathSegments[0] || ''
      } else {
        const params = url.searchParams
        videoId = params.get('v') || params.get('vi') || ''

        if (!videoId && pathSegments.length > 0) {
          videoId = pathSegments[pathSegments.length - 1]
        }
      }

      if (videoId) {
        const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
        applyTimeParams(embedUrl)
        return { embedUrl: embedUrl.toString(), provider: 'youtube' }
      }

      return { embedUrl: null, provider: 'youtube' }
    }

    if (host === 'drive.google.com') {
      const segments = url.pathname.split('/')
      const fileIndex = segments.findIndex((seg) => seg === 'd')
      if (fileIndex > -1 && segments[fileIndex + 1]) {
        return { embedUrl: `https://drive.google.com/file/d/${segments[fileIndex + 1]}/preview`, provider: 'drive' }
      }
      const fileId = url.searchParams.get('id')
      if (fileId) {
        return { embedUrl: `https://drive.google.com/file/d/${fileId}/preview`, provider: 'drive' }
      }
    }
  } catch {
    return { embedUrl: null, provider: 'unknown' }
  }
  return { embedUrl: null, provider: 'unknown' }
}
