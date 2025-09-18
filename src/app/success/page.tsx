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
    heading: 'تم التفعيل — استمتعي بمحتواك الآن',
    subheading: 'شاهدي الفيديو، ثم احجزي مكالمتك المجانية باستخدام الرمز المرفق.',
    banner: 'مبروك! سيصلك الكتاب الإلكتروني عبر الإيميل والواتساب بعد قليل.',
    watchCta: 'اضغطي للتشغيل',
    watchHint: 'شغّلي الفيديو مع الصوت',
    ctaLabel: 'احجز مكالمتك المجانية الآن',
    support: 'فريق الدعم جاهز لأي سؤال — راسلينا على واتساب متى شئت.',
    callLabel: 'رمز المكالمة',
    copy: 'نسخ',
    copied: 'تم النسخ!'
  },
  en: {
    heading: 'You’re all set — enjoy your new material',
    subheading: 'Watch the video, then book your free coaching call with the code below.',
    banner: 'Success! Your downloads will arrive via email and WhatsApp shortly.',
    watchCta: 'Play video',
    watchHint: 'Click to turn on sound',
    ctaLabel: 'Book your free call now',
    support: 'Need help? Message our support on WhatsApp any time.',
    callLabel: 'Call code',
    copy: 'Copy',
    copied: 'Copied!'
  }
}

export default function SuccessPage() {
  const searchParams = useSearchParams()

  const locale: Locale = useMemo(() => (searchParams.get('locale') === 'en' ? 'en' : 'ar'), [searchParams])
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const defaults = DEFAULTS[locale]

  const customerName = searchParams.get('customerName')?.trim() || ''
  const videoUrlParam = searchParams.get('videoUrl')?.trim() || ''
  const videoUrl = videoUrlParam || ENV_DEFAULT_VIDEO_URL || ''
  const callBookingUrl = searchParams.get('callBookingUrl')?.trim() || ENV_DEFAULT_CALL_URL || '/free-call'
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

      <section className="success-card" aria-labelledby="success-heading">
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
          <Link
            className="cta-button"
            href={bookingHref || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaLabel}
          </Link>
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
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2.5rem) 3rem;
          background:
            radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,.08), rgba(255,255,255,0)),
            radial-gradient(700px 400px at 20% 100%, rgba(168,85,247,.08), rgba(255,255,255,0)),
            linear-gradient(180deg, rgba(255,255,255,.95), rgba(250,245,255,.92));
        }

        .success-shell.en {
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .success-banner {
          width: min(960px, 100%);
          background: linear-gradient(90deg, var(--purple-600), var(--purple-400));
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
          background: rgba(255,255,255,0.2);
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
          background: rgba(255,255,255,0.35);
          transform: translateY(-1px);
        }

        .success-card {
          width: min(960px, 100%);
          background: var(--glass-purple-tint), var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: clamp(var(--r-md), 5vw, var(--r-xl));
          box-shadow: var(--glass-shadow-1);
          backdrop-filter: blur(16px) saturate(180%);
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
          color: var(--purple-700);
          text-shadow: 1px 1px 2px rgba(126, 34, 206, .16);
        }

        .success-subheading {
          font-size: clamp(1.05rem, 2.8vw, 1.2rem);
          color: var(--ink-dim);
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
          background: linear-gradient(90deg, var(--purple-700), var(--purple-500));
          color: var(--white);
          text-decoration: none;
          border: none;
          box-shadow: var(--glass-shadow-2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(124,58,237,.25);
        }

        .code-area {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          align-items: stretch;
        }

        .code-label {
          font-weight: 700;
          color: var(--ink-dim);
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
          border: 1px solid rgba(124,58,237,0.25);
          background: rgba(255,255,255,0.8);
          box-shadow: var(--shadow-1);
          font-weight: 700;
          color: var(--purple-700);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .code-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(124,58,237,.2);
          background: rgba(255,255,255,0.92);
        }

        .code-pill.copied {
          background: rgba(22,163,74,0.12);
          border-color: rgba(22,163,74,0.45);
          color: #166534;
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
          background: rgba(255,255,255,0.55);
          border-radius: clamp(var(--r-sm), 3vw, var(--r-lg));
          border: 1px solid rgba(124,58,237,0.18);
          padding: 1rem 1.25rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .success-footer p {
          font-size: 0.98rem;
          color: var(--ink);
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
