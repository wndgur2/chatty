import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      autoComplete = 'off',
      autoCorrect = 'off',
      autoCapitalize = 'none',
      spellCheck = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col w-full relative">
        <input
          ref={ref}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          className={twMerge(
            clsx(
              'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow',
              error && 'border-red-500 focus:ring-red-500',
              className,
            ),
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input
