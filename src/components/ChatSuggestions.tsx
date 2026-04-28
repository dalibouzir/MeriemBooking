import { memo } from 'react'

const SUGGESTIONS = [
  'كيف أتعامل مع نوبات الغضب؟',
  'أحتاج مساعدة في تنظيم وقتي مع أطفالي',
  'أشعر بالإرهاق من مسؤولياتي اليومية',
] as const

type ChatSuggestionsProps = {
  onSelectSuggestion: (text: string) => void
}

function ChatSuggestionsComponent({ onSelectSuggestion }: ChatSuggestionsProps) {
  return (
    <div className="assistant-suggestions" aria-label="اقتراحات سريعة">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          className="assistant-suggestion-chip"
          onClick={() => onSelectSuggestion(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

const ChatSuggestions = memo(ChatSuggestionsComponent)
ChatSuggestions.displayName = 'ChatSuggestions'

export default ChatSuggestions
