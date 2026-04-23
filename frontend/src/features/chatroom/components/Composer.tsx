import { memo, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import { Send } from 'lucide-react'
import Button from '../../../shared/ui/Button'

interface ComposerProps {
  inputValue: string
  isSendLocked: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onInputFocus?: () => void
  inputRef: RefObject<HTMLTextAreaElement | null>
}

function ComposerComponent({
  inputValue,
  isSendLocked,
  onInputChange,
  onSubmit,
  onInputFocus,
  inputRef,
}: ComposerProps) {
  const lineCount = inputValue.split('\n').length
  const textareaRows = Math.min(Math.max(lineCount, 1), 6)

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto">
      <div className="flex-1">
        <div className="rounded-3xl pr-2 border border-gray-200 bg-gray-50 transition-colors overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onInputFocus}
            rows={textareaRows}
            placeholder="Message Chatty..."
            autoComplete="off"
            spellCheck={false}
            className="block w-full bg-transparent px-4 sm:px-5 py-2 text-base leading-6 placeholder:text-gray-400 focus:outline-none min-h-11 max-h-36 resize-none overflow-y-auto overflow-x-hidden [scrollbar-color:var(--scrollbar-thumb)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="rounded-full h-11 w-11 shrink-0 p-0 shadow-sm"
        disabled={!inputValue.trim() || isSendLocked}
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  )
}

const Composer = memo(ComposerComponent)

export default Composer
