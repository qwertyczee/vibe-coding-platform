import type { Components } from 'react-markdown'
import { memo, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

// Memoized component definitions to prevent recreation
const LinkComponent = memo(({ children, href, ...props }: any) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
))

const CodeComponent = memo(({ children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '')
  return (
    <code
      className={`${className || ''} bg-muted px-1 py-0.5 rounded text-sm font-mono`}
      {...props}
    >
      {children}
    </code>
  )
})

const PreComponent = memo(({ children, ...props }: any) => (
  <pre
    className="bg-muted p-3 rounded-sm overflow-x-auto text-sm"
    {...props}
  >
    {children}
  </pre>
))

const H1Component = memo(({ children, ...props }: any) => (
  <h1 className="text-lg font-semibold mb-2 mt-4 first:mt-0" {...props}>
    {children}
  </h1>
))

const H2Component = memo(({ children, ...props }: any) => (
  <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>
    {children}
  </h2>
))

const H3Component = memo(({ children, ...props }: any) => (
  <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0" {...props}>
    {children}
  </h3>
))

const UlComponent = memo(({ children, ...props }: any) => (
  <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>
    {children}
  </ul>
))

const OlComponent = memo(({ children, ...props }: any) => (
  <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>
    {children}
  </ol>
))

const PComponent = memo(({ children, ...props }: any) => (
  <p className="mb-2 last:mb-0" {...props}>
    {children}
  </p>
))

const BlockquoteComponent = memo(({ children, ...props }: any) => (
  <blockquote
    className="border-l-4 border-muted pl-4 italic my-2"
    {...props}
  >
    {children}
  </blockquote>
))

// Static components object - created once and reused
const STATIC_COMPONENTS: Components = {
  a: LinkComponent,
  code: CodeComponent,
  pre: PreComponent,
  h1: H1Component,
  h2: H2Component,
  h3: H3Component,
  ul: UlComponent,
  ol: OlComponent,
  p: PComponent,
  blockquote: BlockquoteComponent,
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: {
  content: string
}) {
  // Memoize the content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => content, [content])
  
  // Use static components to avoid recreation
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={STATIC_COMPONENTS}
    >
      {memoizedContent}
    </ReactMarkdown>
  )
})
