import { memo, type FormEvent, type RefObject } from 'react'
import { Send } from 'lucide-react'
import Input from '../../../shared/ui/Input'
import Button from '../../../shared/ui/Button'

interface ComposerProps {
  inputValue: string
  isSendLocked: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onInputFocus?: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

function ComposerComponent({
  inputValue,
  isSendLocked,
  onInputChange,
  onSubmit,
  onInputFocus,
  inputRef,
}: ComposerProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
      <div className="flex-1">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onInputFocus}
          placeholder="Message Chatty..."
          className="rounded-full px-5 bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11 text-base"
          type="search"
        />
      </div>
      <Button
        type="submit"
        className="rounded-full h-11 w-11 shrink-0 p-0 shadow-sm"
        disabled={!inputValue.trim() || isSendLocked}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  )
}

const Composer = memo(ComposerComponent)

export default Composer
