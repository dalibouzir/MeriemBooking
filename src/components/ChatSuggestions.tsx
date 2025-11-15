import { memo } from 'react'

const SUGGESTIONS = [
  'أشعر بالإرهاق من مسؤولياتي اليومية',
  'أحتاج مساعدة في تنظيم وقتي مع أطفالي',
  'كيف أتعامل مع شعوري بالذنب كأم؟',
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
