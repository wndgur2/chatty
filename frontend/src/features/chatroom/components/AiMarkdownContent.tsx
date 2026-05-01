import 'katex/dist/katex.min.css'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Components } from 'react-markdown'
import { twMerge } from 'tailwind-merge'

const markdownComponents: Components = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- remark passes AST node; omit from DOM
  a({ href, children, node, ...props }) {
    const external = Boolean(href && /^https?:\/\//i.test(href))
    return (
      <a
        href={href}
        {...props}
        rel={external ? 'noopener noreferrer' : undefined}
        target={external ? '_blank' : undefined}
      >
        {children}
      </a>
    )
  },
}

interface AiMarkdownContentProps {
  content: string
  className?: string
}

export function AiMarkdownContent({ content, className }: AiMarkdownContentProps) {
  return (
    <div className={twMerge('min-w-0 max-w-full overflow-x-auto', className)}>
      <div
        className={twMerge(
          'prose prose-sm min-w-0 max-w-none prose-neutral',
          'prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold first:prose-headings:mt-0',
          'prose-p:my-2 prose-p:leading-relaxed first:prose-p:mt-0 last:prose-p:mb-0',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-hr:my-4 prose-hr:border-gray-200',
          'prose-pre:bg-surface-100 prose-pre:border prose-pre:border-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto',
          'prose-pre:text-gray-900 prose-pre:[&_code]:bg-transparent prose-pre:[&_code]:p-0 prose-pre:[&_code]:text-gray-900 prose-pre:[&_code]:font-normal',
          'prose-code:text-gray-900 prose-code:bg-surface-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-code:before:content-none prose-code:after:content-none',
          'text-[15px] text-gray-800',
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
