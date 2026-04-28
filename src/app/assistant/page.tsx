'use client'

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/ScrollHideTopbar'
import ChatSuggestions from '@/components/ChatSuggestions'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  displayText: string
  time: string
  streaming?: boolean
}

const ASSISTANT_TITLE = 'مساعد الذكاء الاصطناعي - Fittrah AI'
const ASSISTANT_DESCRIPTION = 'تواصلي بحرية، أنا هنا لدعمك.'
const DEMO_TIME = '10:30 ص'

const DEMO_USER_TEXT = 'كيف أتعامل مع شعوري بالذنب كأم؟'

const DEMO_ASSISTANT_INTRO =
  'شعور الذنب شائع جداً لدى الأمهات، وغالباً ما يأتي من رغبتك في تقديم الأفضل لأطفالك. إليك بعض الخطوات لمساعدتك على التعامل معه:'

const DEMO_ASSISTANT_POINTS = [
  'تذكري أن الكمال غير واقعي، والأمومة رحلة مليئة بالتعلم.',
  'ركزي على اللحظات اليومية التي تعيشينها مع أطفالك.',
  'سامحي نفسك، فليس كل خطأ يعني أنك أم سيئة.',
  'حددي احتياجاتك وخصصي وقتاً لنفسك دون شعور بالذنب.',
] as const

const DEMO_ASSISTANT_OUTRO = 'كل أم تبذل جهدها، وهذا كافٍ. أنت تقومين بعمل رائع 🌸'

const TYPING_INTERVAL_MS = 14
const TYPING_STEP = 2

const preprocessAssistantText = (input: string) => {
  if (!input) return ''
  let text = input.trim()
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/[ \t]{2,}/g, ' ')
  const boldMarks = (text.match(/\*\*/g) || []).length
  if (boldMarks % 2 !== 0) {
    text += '**'
  }
  return text
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

function AssistantIntroCard() {
  return (
    <aside className="assistant-intro-card" aria-label="عن المساعد">
      <div className="assistant-intro-content">
        <h2 className="assistant-intro-title">مساعدك الذكي لدعمك كل يوم</h2>
        <p className="assistant-intro-subtitle">
          أنا هنا لأمنحك إجابات دقيقة وسريعة حول التوازن العاطفي، تنظيم المشاعر، وبناء علاقة صحية مع نفسك
          وأطفالك. اسأليني عن أي موضوع يهمك، وسأكون بجانبك.
        </p>

        <div className="assistant-benefits" aria-label="مزايا المساعد">
          <div className="assistant-benefit-row">
            <div className="assistant-benefit-icon" aria-hidden>
              <SparklesIcon />
            </div>
            <div className="assistant-benefit-text">
              <p className="assistant-benefit-title">فهم أعمق لمشاعرك</p>
              <p className="assistant-benefit-desc">نساعدك على فهم مشاعرك وتحديدها بوضوح.</p>
            </div>
          </div>

          <div className="assistant-benefit-row">
            <div className="assistant-benefit-icon" aria-hidden>
              <WrenchScrewdriverIcon />
            </div>
            <div className="assistant-benefit-text">
              <p className="assistant-benefit-title">أدوات عملية يومية</p>
              <p className="assistant-benefit-desc">تقنيات وتمارين بسيطة يمكنك تطبيقها فوراً.</p>
            </div>
          </div>

          <div className="assistant-benefit-row">
            <div className="assistant-benefit-icon" aria-hidden>
              <ShieldCheckIcon />
            </div>
            <div className="assistant-benefit-text">
              <p className="assistant-benefit-title">دعم مخصص وآمن</p>
              <p className="assistant-benefit-desc">خصوصيتك وراحتك النفسية من أولويتنا.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="assistant-privacy-note">
        <ShieldCheckIcon aria-hidden />
        <span>هذه المحادثة سرية وآمنة 100% ولا يتم حفظها.</span>
      </div>
      <div className="assistant-intro-botanical" aria-hidden />
    </aside>
  )
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const adjustInputHeight = useCallback(() => {
    const element = inputRef.current
    if (!element) return
    const computedStyle = window.getComputedStyle(element)
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 4

    element.style.height = 'auto'
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, element.scrollHeight))
    element.style.height = `${nextHeight}px`
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    document.body.classList.add('assistant-view')
    return () => {
      document.body.classList.remove('assistant-view')
    }
  }, [])

  useEffect(() => {
    if (messages.length <= 1) return
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const streamingMessage = messages.find((message) => message.streaming)
  const streamingMessageId = streamingMessage?.id || null

  useEffect(() => {
    if (!streamingMessageId) return

    const interval = window.setInterval(() => {
      let shouldStop = false

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== streamingMessageId) return message

          const nextLength = Math.min(message.displayText.length + TYPING_STEP, message.text.length)
          const nextDisplay = message.text.slice(0, nextLength)

          if (nextLength >= message.text.length) {
            shouldStop = true
            return { ...message, displayText: nextDisplay, streaming: false }
          }

          return { ...message, displayText: nextDisplay }
        }),
      )

      if (shouldStop) {
        window.clearInterval(interval)
      }
    }, TYPING_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [streamingMessageId])

  useEffect(() => {
    adjustInputHeight()
  }, [adjustInputHeight, inputValue])

  const sendMessage = useCallback(
    async (event?: FormEvent, overrideText?: string) => {
      if (event) event.preventDefault()
      const sourceText = typeof overrideText === 'string' ? overrideText : inputValue
      const trimmed = sourceText.trim()
      if (!trimmed || loading) return

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        text: trimmed,
        displayText: trimmed,
        time: formatTime(new Date()),
      }

      const conversation = [...messages, userMessage]
      setMessages(conversation)
      setInputValue('')
      setError(null)
      setSuggestionsVisible(false)
      setLoading(true)

      try {
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversation.map((message) => ({
              role: message.role,
              content: message.text,
            })),
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'عذراً، تعذّر التواصل مع المساعد.')
        }

        const assistantText =
          typeof data?.message === 'string' && data.message.trim()
            ? data.message.trim()
            : 'وصلت رسالتك، سأراجعها وأعود بحلول عملية.'

        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: 'assistant',
          text: assistantText,
          displayText: '',
          time: formatTime(new Date()),
          streaming: true,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error(err)
        setError('عذراً، حدث خطأ أثناء الاتصال بالمساعد. حاول مرة أخرى لاحقاً.')
      } finally {
        setLoading(false)
      }
    },
    [inputValue, loading, messages],
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      if (loading) return
      setSuggestionsVisible(false)
      setInputValue(suggestion)
      const scheduleSend = () => {
        void sendMessage(undefined, suggestion)
      }
      if (typeof window === 'undefined') {
        scheduleSend()
        return
      }
      window.requestAnimationFrame(scheduleSend)
    },
    [loading, sendMessage],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const hasMessages = messages.length > 0
  const shouldShowChips = suggestionsVisible && !loading

  const renderedMessages = useMemo(() => {
    if (hasMessages) return null

    return (
      <>
        <div className="assistant-message-row message-user">
          <div className="assistant-bubble assistant-bubble-user">
            <p>{DEMO_USER_TEXT}</p>
            <span className="assistant-timestamp">{DEMO_TIME}</span>
          </div>
          <div className="assistant-avatar assistant-avatar-user">
            <UserCircleIcon aria-hidden />
            <span className="sr-only">أنت</span>
          </div>
        </div>

        <div className="assistant-message-row message-bot">
          <div className="assistant-avatar assistant-avatar-bot">
            <ChatBubbleLeftRightIcon aria-hidden />
            <span className="sr-only">Fittrah AI</span>
          </div>
          <div className="assistant-bubble assistant-bubble-bot assistant-demo-bubble">
            <p>{DEMO_ASSISTANT_INTRO}</p>
            <ul>
              {DEMO_ASSISTANT_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p>{DEMO_ASSISTANT_OUTRO}</p>
            <span className="assistant-timestamp">{DEMO_TIME}</span>
          </div>
        </div>
      </>
    )
  }, [hasMessages])

  return (
    <div className="assistant-page" dir="rtl">
      <Navbar />
      <main className="assistant-main">
        <section className="assistant-layout" aria-label="واجهة مساعد Fittrah AI">
          <section className="assistant-chat-panel">
            <header className="assistant-chat-header">
              <div>
                <h1 className="assistant-chat-title">{ASSISTANT_TITLE}</h1>
                <p className="assistant-chat-subtitle">{ASSISTANT_DESCRIPTION}</p>
              </div>
              <div className="assistant-chat-icon" aria-hidden>
                <ChatBubbleLeftRightIcon />
              </div>
            </header>

            <div className="assistant-chat-body">
              <div className="assistant-messages" ref={messagesContainerRef}>
                {hasMessages
                  ? messages.map((message) => {
                      const isUser = message.role === 'user'
                      const textToDisplay = message.displayText || message.text
                      const shouldRenderMarkdown = !isUser && !message.streaming
                      const processedAssistantText = shouldRenderMarkdown ? preprocessAssistantText(textToDisplay) : ''

                      return (
                        <div key={message.id} className={`assistant-message-row ${isUser ? 'message-user' : 'message-bot'}`}>
                          {!isUser && (
                            <div className="assistant-avatar assistant-avatar-bot">
                              <ChatBubbleLeftRightIcon aria-hidden />
                              <span className="sr-only">Fittrah AI</span>
                            </div>
                          )}
                          <div className={`assistant-bubble ${isUser ? 'assistant-bubble-user' : 'assistant-bubble-bot'}`}>
                            {shouldRenderMarkdown ? (
                              <div className="assistant-markdown">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                  {processedAssistantText}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p>{textToDisplay}</p>
                            )}
                            <span className="assistant-timestamp">{message.time}</span>
                          </div>
                          {isUser && (
                            <div className="assistant-avatar assistant-avatar-user">
                              <UserCircleIcon aria-hidden />
                              <span className="sr-only">أنت</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  : renderedMessages}

                {loading && (
                  <div className="assistant-message-row message-bot assistant-typing">
                    <div className="assistant-avatar assistant-avatar-bot">
                      <ChatBubbleLeftRightIcon aria-hidden />
                      <span className="sr-only">Fittrah AI</span>
                    </div>
                    <div className="assistant-bubble assistant-bubble-bot assistant-bubble-typing">
                      <span>Fittrah AI يكتب...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="assistant-chat-actions">
                {error && <p className="assistant-error">{error}</p>}
                {shouldShowChips && <ChatSuggestions onSelectSuggestion={handleSelectSuggestion} />}

                <form className="assistant-input-row" onSubmit={sendMessage}>
                  <div className="assistant-input-wrapper">
                    <textarea
                      ref={inputRef}
                      dir="rtl"
                      className="assistant-input"
                      aria-label="اكتبي سؤالك هنا"
                      placeholder="اكتبي سؤالك هنا..."
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      disabled={loading}
                    />

                    <button type="submit" className="assistant-send-btn" disabled={loading || !inputValue.trim()}>
                      <PaperAirplaneIcon aria-hidden />
                      <span className="sr-only">إرسال</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <p className="assistant-footer-note">ملاحظة: إجابات المساعد لا تغني عن الاستشارة المتخصصة.</p>
          </section>

          <AssistantIntroCard />
        </section>
      </main>
    </div>
  )
}
