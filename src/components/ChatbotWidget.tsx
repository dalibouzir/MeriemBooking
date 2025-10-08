"use client"

import { AnimatePresence, motion } from 'motion/react'
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FormEvent, useEffect, useRef, useState } from 'react'

const QUICK_REPLIES = [
  'أرغب في حجز جلسة استشارية',
  'أحتاج مساعدة في اختيار دورة مناسبة',
  'كيف أستخدم رمز المكالمة المجاني؟',
  'أريد التحدث مع فريق الدعم الآن',
]

type ChatMessage = {
  id: string
  body: string
  timestamp: Date
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const body = (data.get('message') as string | null)?.trim()
    if (!body) return
    setMessages((prev) => [
      ...prev,
      { id: createId(), body, timestamp: new Date() },
    ])
    form.reset()
    if (textareaRef.current) textareaRef.current.focus()
  }

  const handleQuickReply = (text: string) => {
    setOpen(true)
    setMessages((prev) => [
      ...prev,
      { id: createId(), body: text, timestamp: new Date() },
    ])
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
              <div className="chatbot-thread" aria-live="polite">
                {messages.length === 0 ? (
                  <p className="chatbot-placeholder">
                    ابدئي بمشاركة ما يشغلك الآن، أو اختاري من الاقتراحات السريعة أدناه.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="chatbot-message">
                      <p>{message.body}</p>
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
                    key={reply}
                    type="button"
                    className="chatbot-chip"
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
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

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
