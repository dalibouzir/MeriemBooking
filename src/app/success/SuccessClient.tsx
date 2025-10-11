'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
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

const DEFAULTS: Record<Locale, {
  heading: string
  subheading: string
  banner: string
  watchCta: string
  watchHint: string
  ctaLabel: string
  support: string
  callLabel: string
  copy: string
  copied: string
}> = {
  ar: {
    heading: 'رمزك جاهز — استبدليه واحجزي مكالمتك',
    subheading: 'ابدئي بالتوجه إلى صفحة استبدال الرمز، ثم تابعي اختيار موعدك على Calendly.',
    banner: 'مبروك! سيصلك الملف ورمز المكالمة عبر الإيميل والواتساب خلال دقائق.',
    watchCta: 'اضغطي للتشغيل',
    watchHint: 'شغّلي الفيديو مع الصوت',
    ctaLabel: 'استبدلي الرمز الآن',
    support: 'فريق الدعم جاهز لأي استفسار حول الرمز أو التنزيل — راسلينا على واتساب متى شئت.',
    callLabel: 'رمز المكالمة',
    copy: 'نسخ',
    copied: 'تم النسخ!'
  },
  en: {
    heading: 'Your code is ready — redeem it to book the call',
    subheading: 'Start by redeeming the code, then pick your Calendly slot with that code applied.',
    banner: 'Awesome! Your download and call code will arrive by email and WhatsApp within minutes.',
    watchCta: 'Play video',
    watchHint: 'Click to turn on sound',
    ctaLabel: 'Redeem the code now',
    support: 'Need help with the code or download? Message our WhatsApp support any time.',
    callLabel: 'Call code',
    copy: 'Copy',
    copied: 'Copied!'
  }
}

export default function SuccessClient() {
  const searchParams = useSearchParams()

  const locale: Locale = useMemo(() => (searchParams.get('locale') === 'en' ? 'en' : 'ar'), [searchParams])
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const defaults = DEFAULTS[locale]

  const customerName = searchParams.get('customerName')?.trim() || ''
  const videoUrlParam = searchParams.get('videoUrl')?.trim() || ''
  const videoUrl = videoUrlParam || ENV_DEFAULT_VIDEO_URL || ''
  const callBookingUrl = searchParams.get('callBookingUrl')?.trim() || ENV_DEFAULT_CALL_URL || '/redeem'
  const callCodeParam = searchParams.get('callCode')?.trim() || ''
  const supportText = searchParams.get('supportText')?.trim() || ENV_DEFAULT_SUPPORT_TEXT || defaults.support
  const ctaLabel = searchParams.get('ctaLabel')?.trim() || ENV_DEFAULT_CTA_LABEL || defaults.ctaLabel

  const bannerMessage = useMemo(() => {
    if (!customerName) return defaults.banner
    return locale === 'ar'
      ? `مبروك يا ${customerName}! سيصلك الكتاب الإلكتروني عبر الإيميل والواتساب بعد قليل.`
      : `Congrats ${customerName}! Your downloads will arrive via email and WhatsApp shortly.`
  }, [customerName, defaults.banner, locale])

  const callCodeValue = useMemo(() => {
    if (!callCodeParam) return ''
    const trimmed = callCodeParam.replace(/^\s+|\s+$/g, '')
    const withoutLeading = trimmed.replace(/^[?&]+/, '')
    const firstEquals = withoutLeading.indexOf('=')
    if (firstEquals > -1) {
      const key = withoutLeading.slice(0, firstEquals)
      const value = withoutLeading.slice(firstEquals + 1)
      if (key === 'code' && value) return value
      try {
        const params = new URLSearchParams(withoutLeading)
        const code = params.get('code')
        if (code) return code
      } catch {
        // ignore — fall back to raw string
      }
      return value || withoutLeading
    }
    return withoutLeading
  }, [callCodeParam])

  const bookingHref = useMemo(() => {
    if (!callBookingUrl) {
      if (!callCodeValue) return ''
      if (/^[?&]/.test(callCodeParam)) {
        return callCodeParam.startsWith('?') ? callCodeParam : `?${callCodeParam.replace(/^&/, '')}`
      }
      return callCodeValue
    }

    if (!callCodeValue) return callBookingUrl

    const urlHasCode = /[?&](code|token)=/i.test(callBookingUrl)
    if (urlHasCode) return callBookingUrl

    const separator = callBookingUrl.includes('?') ? '&' : '?'
    return `${callBookingUrl}${separator}code=${encodeURIComponent(callCodeValue)}`
  }, [callBookingUrl, callCodeParam, callCodeValue])

  const isExternalBooking = useMemo(() => {
    if (!bookingHref) return false
    return !(bookingHref.startsWith('/') || bookingHref.startsWith('#'))
  }, [bookingHref])

  const videoInfo = useMemo<VideoInfo>(() => parseVideoUrl(videoUrl), [videoUrl])

  const [isBannerVisible, setBannerVisible] = useState(true)
  const [isPlaying, setPlaying] = useState(false)
  const [wasCopied, setWasCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  useEffect(() => {
    if (!wasCopied) return
    const timer = window.setTimeout(() => setWasCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [wasCopied])

  const handleCopy = async () => {
    if (!callCodeValue) return
    try {
      await navigator.clipboard.writeText(callCodeValue)
      setCopyError(null)
      setWasCopied(true)
    } catch {
      setCopyError(locale === 'ar' ? 'لم نتمكن من نسخ الرمز تلقائيًا.' : 'Could not copy the code automatically.')
    }
  }

  const handlePlay = () => {
    if (!videoInfo.embedUrl) return
    setPlaying(true)
  }

  const embedSrc = useMemo(() => {
    if (!videoInfo.embedUrl) return ''
    const separator = videoInfo.embedUrl.includes('?') ? '&' : '?'
    return `${videoInfo.embedUrl}${separator}autoplay=1&mute=0&rel=0`
  }, [videoInfo.embedUrl])

  return (
    <main className={`success-shell ${locale}`} dir={dir} lang={locale}>
      {isBannerVisible && (
        <div className="success-banner" role="status">
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

      <section className="success-card glass-water polished" aria-labelledby="success-heading">
        <header className="success-header">
          <h1 id="success-heading">{defaults.heading}</h1>
          <p className="success-subheading">{defaults.subheading}</p>
        </header>

        <div className="video-block">
          {isPlaying && videoInfo.embedUrl ? (
            <div className="video-embed" role="region" aria-label={locale === 'ar' ? 'مشغل الفيديو' : 'Video player'}>
              <iframe
                src={embedSrc}
                title={locale === 'ar' ? 'تشغيل الفيديو' : 'Play video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

        <div className="cta-block">
          <Link className="cta-button" href={bookingHref || '#'} target={isExternalBooking ? '_blank' : undefined} rel={isExternalBooking ? 'noopener noreferrer' : undefined}>
            {ctaLabel}
          </Link>
          <p className="free-note">
            الجلسة مجانية بالكامل — بعد استبدال الرمز يمكنك متابعة الحجز على Calendly دون أي دفع.
          </p>
          {callCodeValue && (
            <div className="code-area">
              <span className="code-label">{defaults.callLabel}</span>
              <button
                type="button"
                className={`code-pill${wasCopied ? ' copied' : ''}`}
                onClick={handleCopy}
                aria-live="polite"
              >
                <span className="code-value">{callCodeValue}</span>
                <span className="code-action">{wasCopied ? defaults.copied : defaults.copy}</span>
              </button>
            </div>
          )}
          {copyError && <p className="copy-error" role="alert">{copyError}</p>}
        </div>

        <footer className="success-footer">
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
          width: min(960px, 100%);
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
          text-align: center;
          display: grid;
          gap: var(--sp-3);
        }

        .success-header h1 {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 800;
          color: hsl(var(--text));
          text-shadow: 1px 1px 2px hsl(var(--text-subtle) / 0.25);
        }

        .success-subheading {
          font-size: clamp(1.05rem, 2.8vw, 1.2rem);
          color: hsl(var(--text-dim));
          font-weight: 600;
        }

        .video-block {
          display: grid;
          gap: var(--sp-3);
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
          gap: var(--sp-4);
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 0.85rem 1.4rem;
          border-radius: clamp(var(--r-sm), 4vw, var(--r-lg));
          font-weight: 800;
          font-size: clamp(1rem, 2.6vw, 1.15rem);
          background: linear-gradient(118deg, hsl(var(--primary-700)), hsl(var(--accent)));
          color: var(--white);
          text-decoration: none;
          border: none;
          box-shadow: var(--shadow-2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px hsl(var(--primary-700) / 0.28);
        }

        .free-note {
          font-size: 0.95rem;
          color: hsl(var(--text-dim));
          line-height: 1.6;
          margin: -0.5rem 0 0;
        }

        .code-area {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          align-items: stretch;
        }

        .code-label {
          font-weight: 700;
          color: hsl(var(--primary-700));
          font-size: 0.95rem;
        }

        .code-pill {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--sp-3);
          padding: 0.75rem 1rem;
          border-radius: 999px;
          border: 1px solid var(--surface-border);
          background: hsla(var(--glass-strong));
          box-shadow: var(--shadow-1);
          font-weight: 700;
          color: hsl(var(--text));
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .code-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px hsl(var(--primary) / 0.2);
          background: hsla(var(--glass));
        }

        .code-pill.copied {
          background: linear-gradient(120deg, hsl(var(--primary-600)), hsl(var(--secondary)));
          border-color: transparent;
          color: var(--white);
        }

        .code-value {
          font-size: 1.05rem;
          letter-spacing: 0.08em;
        }

        .code-action {
          font-size: 0.85rem;
          font-weight: 700;
          color: inherit;
          opacity: 0.85;
        }

        .copy-error {
          font-size: 0.9rem;
          color: var(--danger);
          font-weight: 600;
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

          .cta-block {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 960px) {
          .success-card {
            gap: 2.5rem;
          }
        }
      `}</style>
      <style jsx>{`
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

        :global(.success-header h1) {
          color: hsl(var(--text));
          text-shadow: 1px 1px 2px hsl(var(--text-subtle) / 0.25);
        }

        :global(.success-subheading) {
          color: hsl(var(--text-dim));
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
          background: linear-gradient(118deg, hsl(var(--primary-700)), hsl(var(--accent)));
          box-shadow: 0 24px 60px hsl(var(--primary-700) / 0.28);
          color: var(--white);
        }

        :global(.cta-button:hover) {
          box-shadow: 0 28px 70px hsl(var(--primary-700) / 0.32);
        }

        :global(.free-note) {
          color: hsl(var(--text-dim));
        }

        :global(.code-label) {
          color: hsl(var(--primary-700));
        }

        :global(.code-pill) {
          background: hsla(var(--glass-strong));
          border: 1px solid var(--surface-border);
          box-shadow: 0 12px 32px hsl(var(--primary) / 0.16);
          color: hsl(var(--text));
        }

        :global(.code-pill:hover) {
          box-shadow: 0 16px 36px hsl(var(--primary) / 0.2);
          background: hsla(var(--glass));
        }

        :global(.code-pill.copied) {
          background: linear-gradient(120deg, hsl(var(--primary-600)), hsl(var(--secondary)));
          color: var(--white);
        }

        :global(.code-action) {
          color: hsl(var(--primary-700));
        }

        :global(.code-pill.copied .code-action) {
          color: hsla(0 0% 100% / 0.92);
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

    if (host === 'youtu.be') {
      const videoId = url.pathname.slice(1)
      if (videoId) {
        return { embedUrl: `https://www.youtube.com/embed/${videoId}`, provider: 'youtube' }
      }
    }

    if (host.endsWith('youtube.com')) {
      const params = url.searchParams
      const id = params.get('v') || params.get('vi')
      if (id) {
        return { embedUrl: `https://www.youtube.com/embed/${id}`, provider: 'youtube' }
      }
      const pathname = url.pathname.split('/')
      const embedIndex = pathname.findIndex((part) => part === 'embed')
      if (embedIndex > -1 && pathname[embedIndex + 1]) {
        return { embedUrl: `https://www.youtube.com/embed/${pathname[embedIndex + 1]}`, provider: 'youtube' }
      }
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
