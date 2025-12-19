"use client"

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FormEvent, useEffect, useRef, useState } from 'react'

type ChatbotAction = {
  label: string
  href: string
  external?: boolean
}

type QuickReplyConfig = {
  id: string
  label: string
  response: string
  actions?: ChatbotAction[]
  keywords?: string[]
}

type ChatMessage = {
  id: string
  author: 'user' | 'bot'
  body: string
  timestamp: Date
  actions?: ChatbotAction[]
}

const BOT_RESPONSE_DELAY = 260
const FALLBACK_RESPONSE = 'شكرًا على رسالتك! سيعاودك الفريق خلال دقائق قليلة.'

const QUICK_REPLIES: QuickReplyConfig[] = [
  {
    id: 'book-session',
    label: 'أرغب في حجز جلسة استشارية',
    response:
      'لحجز مكالمتك المجانية حمّلي أولًا أحد الملفات المجانية لتحصلي على رمز المكالمة، ثم انتقلي إلى صفحة استبدال الرمز لاختيار الموعد.',
    actions: [
      { label: 'تصفّح الملفات المجانية', href: '/products' },
      { label: 'استبدال رمز المكالمة', href: '/redeem' },
    ],
    keywords: ['حجز', 'جلسة', 'استشارية', 'موعد', 'رمز'],
  },
  {
    id: 'pick-course',
    label: 'أحتاج مساعدة في اختيار دورة مناسبة',
    response: 'اطّلعي على صفحة الموارد للاطلاع على كل الدورات والفرق بينها. إذا رغبتِ في توصية شخصية فراسلينا وسنقترح عليك الأنسب.',
    actions: [
      { label: 'تصفّح الموارد', href: '/products' },
    ],
    keywords: ['دورة', 'كورس', 'موارد', 'اختيار'],
  },
  {
    id: 'free-call-code',
    label: 'كيف أستخدم رمز المكالمة المجاني؟',
    response:
      'بعد تحميل أي ملف مجاني يصلك رمز عبر البريد. انتقلي إلى صفحة استبدال الرمز وأدخلي الكود ثم تابعي اختيار الموعد المناسب لكِ.',
    actions: [
      { label: 'تأكيد الكود الآن', href: '/redeem' },
    ],
    keywords: ['رمز', 'كود', 'مكالمة', 'مجاني'],
  },
  {
    id: 'contact-support',
    label: 'أريد التحدث مع فريق الدعم الآن',
    response: 'يسرّنا مساعدتك مباشرة. بإمكانك فتح دردشة واتساب فورية أو زيارة صفحة الدعم لإرسال طلب متابعة.',
    actions: [
      { label: 'دردشة واتساب', href: 'https://wa.me/21629852313', external: true },
      { label: 'صفحة الدعم والنماذج', href: '/chat' },
    ],
    keywords: ['دعم', 'واتساب', 'تحدث', 'support'],
  },
  {
    id: 'admin-login',
    label: 'أريد تسجيل الدخول كأدمن',
    response:
      'للدخول إلى الحساب الإداري اضغطي زر تسجيل الدخول التالي، وبعد تسجيل الدخول ستظهر لوحة التحكم وزر الخروج في الأعلى.',
    actions: [{ label: 'تسجيل الدخول', href: '/login' }],
    keywords: ['dali', 'دالي', 'تسجيل الدخول', 'دخول', 'أدمن', 'لوحة التحكم', 'admin', 'login'],
  },
]

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpen(false)
    }

    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!threadRef.current) return
    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  const pushUserMessage = (body: string) => {
    const message = makeUserMessage(body)
    setMessages((prev) => [...prev, message])
  }

  const pushBotMessage = (body: string, actions?: ChatbotAction[]) => {
    const message = makeBotMessage(body, actions)
    setMessages((prev) => [...prev, message])
  }

  const scheduleBotResponse = (reply: QuickReplyConfig | null) => {
    const responseBody = reply?.response ?? FALLBACK_RESPONSE
    const responseActions = reply?.actions
    setTimeout(() => {
      pushBotMessage(responseBody, responseActions)
    }, BOT_RESPONSE_DELAY)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const body = normalizeText((data.get('message') as string | null) ?? '')
    if (!body) return

    pushUserMessage(body)
    scheduleBotResponse(findQuickReply(body))

    form.reset()
    if (textareaRef.current) textareaRef.current.focus()
  }

  const handleQuickReply = (reply: QuickReplyConfig) => {
    setOpen(true)
    pushUserMessage(reply.label)
    scheduleBotResponse(reply)

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    })
  }

  return (
    <div className="chatbot-widget" ref={containerRef}>
      <button
        type="button"
        className={`chatbot-trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-label={open ? 'إغلاق مساعد الدردشة' : 'فتح مساعد الدردشة'}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="chatbot-trigger-icon" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            key="chatbot-panel"
            className="chatbot-panel"
            role="dialog"
            aria-label="مساعد فطرة الأمهات"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.36, 0.66, 0.04, 1] }}
          >
            <header className="chatbot-header">
              <div>
                <p className="chatbot-title">مساعد فطرة الأمهات</p>
                <p className="chatbot-sub">أرسلي سؤالك وسنرد خلال دقائق قليلة.</p>
              </div>
              <button
                type="button"
                className="chatbot-close"
                aria-label="إغلاق المحادثة"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="chatbot-close-icon" aria-hidden />
              </button>
            </header>

            <div className="chatbot-body">
              <div className="chatbot-thread" aria-live="polite" ref={threadRef}>
                {messages.length === 0 ? (
                  <p className="chatbot-placeholder">
                    ابدئي بمشاركة ما يشغلك الآن، أو اختاري من الاقتراحات السريعة أدناه.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`chatbot-message${message.author === 'user' ? ' from-user' : ' from-bot'}`}
                    >
                      <p className="chatbot-message-body">{message.body}</p>
                      {message.actions?.length ? (
                        <div className="chatbot-message-actions">
                          {message.actions.map((action) =>
                            action.external ? (
                              <a
                                key={`${message.id}-${action.href}`}
                                href={action.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chatbot-message-action"
                                onClick={() => setOpen(false)}
                              >
                                {action.label}
                              </a>
                            ) : (
                              <Link
                                key={`${message.id}-${action.href}`}
                                href={action.href}
                                prefetch={false}
                                className="chatbot-message-action"
                                onClick={() => setOpen(false)}
                              >
                                {action.label}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : null}
                      <span className="chatbot-time">
                        {message.timestamp.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="chatbot-quick">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    className="chatbot-chip"
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="chatbot-form" onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                name="message"
                placeholder="اكتبي رسالتك هنا..."
                rows={3}
                required
                className="chatbot-input"
              />
              <button type="submit" className="btn btn-primary chatbot-send">
                <PaperAirplaneIcon className="chatbot-send-icon" aria-hidden />
                <span>إرسال</span>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function findQuickReply(text: string): QuickReplyConfig | null {
  const normalized = normalizeText(text)
  if (!normalized) return null

  for (const reply of QUICK_REPLIES) {
    if (normalizeText(reply.label) === normalized) {
      return reply
    }
  }

  const lowered = normalized.toLowerCase()

  for (const reply of QUICK_REPLIES) {
    if (!reply.keywords?.length) continue
    const match = reply.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword)
      if (!normalizedKeyword) return false
      return normalized.includes(normalizedKeyword) || lowered.includes(normalizedKeyword.toLowerCase())
    })
    if (match) return reply
  }

  return null
}

function makeUserMessage(body: string): ChatMessage {
  return {
    id: createId(),
    author: 'user',
    body,
    timestamp: new Date(),
  }
}

function makeBotMessage(body: string, actions?: ChatbotAction[]): ChatMessage {
  return {
    id: createId(),
    author: 'bot',
    body,
    actions,
    timestamp: new Date(),
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
