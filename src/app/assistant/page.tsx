'use client'

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import Navbar from '@/components/ScrollHideTopbar'
import ChatSuggestions from '@/components/ChatSuggestions'
import { ArrowUpIcon, ChatBubbleLeftRightIcon, UserCircleIcon } from '@heroicons/react/24/outline'
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
const ASSISTANT_DESCRIPTION = 'أنا هنا لأمنحك إجابات دافئة وسريعة حول التوازن العاطفي، وتخطيط الجلسات، وكل ما يخص يوم الأم.'
const INITIAL_GREETING = 'مرحباً! أنا Fittrah AI، شاركيني ما يدور في بالك وسأقترح خطوات عملية.'

const INPUT_SUGGESTIONS = [
  'اكتبي رسالتك بالتفصيل…',
  'مثال: أشعر بالتعب والضغط، كيف أتعامل مع هذا الشعور؟',
  'مثال: كيف أنظم وقتي بين الأطفال والبيت والراحة؟',
  'مثال: كيف أتعامل مع غضب طفلي بطريقة هادئة؟',
]

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

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showSuggestion, setShowSuggestion] = useState(true)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const suggestionIntervalRef = useRef<number | null>(null)
  const suggestionTimeoutRef = useRef<number | null>(null)
  const adjustInputHeight = useCallback(() => {
    const element = inputRef.current
    if (!element) return
    const computedStyle = window.getComputedStyle(element)
    const lineHeight = parseFloat(computedStyle.lineHeight) || 22
    const minHeight = lineHeight * 2
    const maxHeight = lineHeight * 3

    element.style.height = 'auto'
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, element.scrollHeight))
    element.style.height = `${nextHeight}px`
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  const clearSuggestionTimers = useCallback(() => {
    if (suggestionIntervalRef.current) {
      window.clearInterval(suggestionIntervalRef.current)
      suggestionIntervalRef.current = null
    }
    if (suggestionTimeoutRef.current) {
      window.clearTimeout(suggestionTimeoutRef.current)
      suggestionTimeoutRef.current = null
    }
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
    if (inputValue.trim() !== '' || isInputFocused) {
      setShowSuggestion(false)
      clearSuggestionTimers()
      return
    }

    clearSuggestionTimers()
    setShowSuggestion(true)

    suggestionIntervalRef.current = window.setInterval(() => {
      setShowSuggestion(false)
      suggestionTimeoutRef.current = window.setTimeout(() => {
        setCurrentSuggestionIndex((prev) => (prev + 1) % INPUT_SUGGESTIONS.length)
        setShowSuggestion(true)
      }, 280)
    }, 5000)

    return () => {
      clearSuggestionTimers()
    }
  }, [clearSuggestionTimers, inputValue, isInputFocused])
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

  return (
    <div className="assistant-page" dir="rtl">
      <Navbar />
      <main className="assistant-main">
        <div className="assistant-chat">
          <header className="assistant-chat-header">
            <div className="assistant-hero-icon">
              <ChatBubbleLeftRightIcon aria-hidden />
            </div>
            <div>
              <p className="assistant-chat-title">{ASSISTANT_TITLE}</p>
              <p className="assistant-chat-subtitle">{ASSISTANT_DESCRIPTION}</p>
            </div>
          </header>

          <div className="assistant-messages" ref={messagesContainerRef}>
            {messages.map((message) => {
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
                  <div className="assistant-bubble">
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
            })}
            {loading && (
              <div className="assistant-message-row message-bot assistant-typing">
                <div className="assistant-avatar assistant-avatar-bot">
                  <ChatBubbleLeftRightIcon aria-hidden />
                  <span className="sr-only">Fittrah AI</span>
                </div>
                <div className="assistant-bubble assistant-bubble-typing">
                  <span>Fittrah AI يكتب...</span>
                </div>
              </div>
            )}
          </div>

          {error && <p className="assistant-error">{error}</p>}

          {suggestionsVisible && <ChatSuggestions onSelectSuggestion={handleSelectSuggestion} />}
          <form className="assistant-input-row" onSubmit={sendMessage}>
            <div className="assistant-input-wrapper">
              <textarea
                ref={inputRef}
                dir="rtl"
                className="assistant-input"
                aria-label="اكتبي رسالتك بالتفصيل"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={loading}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {inputValue.trim() === '' && !isInputFocused && (
                <div className={`assistant-input-hint ${showSuggestion ? 'hint-visible' : 'hint-hidden'}`}>
                  {INPUT_SUGGESTIONS[currentSuggestionIndex]}
                </div>
              )}
              <button type="submit" className="assistant-send-btn" disabled={loading || !inputValue.trim()}>
                <ArrowUpIcon aria-hidden />
                <span className="sr-only">إرسال</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
