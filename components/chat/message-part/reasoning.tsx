import type { ReasoningUIPart } from 'ai'
import { MarkdownRenderer } from '@/components/markdown-renderer/markdown-renderer'
import { MessageSpinner } from '../message-spinner'
import { useReasoningContext } from '../message'
import { memo, useCallback, useMemo } from 'react'
import { ChevronDownIcon, ChevronRightIcon, BrainIcon } from 'lucide-react'

export const Reasoning = memo(function Reasoning({
  part,
  partIndex,
}: {
  part: ReasoningUIPart
  partIndex: number
}) {
  const context = useReasoningContext()
  const isExpanded = context?.expandedReasoningIndex === partIndex

  if (part.state === 'done' && !part.text) {
    return null
  }

  const text = part.text || '_Thinking_'
  const isStreaming = part.state === 'streaming'
  
  const reasoningInfo = useMemo(() => {
    const firstLine = text.split('\n')[0].replace(/\*\*/g, '')
    const hasMoreContent = text.includes('\n') || text.length > 80
    const wordCount = text.split(/\s+/).length
    return { firstLine, hasMoreContent, wordCount }
  }, [text])

  const handleToggle = useCallback(() => {
    if (context) {
      const newIndex = isExpanded ? null : partIndex
      context.setExpandedReasoningIndex(newIndex)
      // Disable auto-expand when user manually toggles
      if (context.autoExpand) {
        context.setAutoExpand(false)
      }
    }
  }, [isExpanded, partIndex, context])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }, [handleToggle])

  return (
    <div className="border border-border/50 bg-muted/30 rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors select-none"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Reasoning ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <BrainIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">
            Reasoning
          </span>
          {isStreaming && (
            <MessageSpinner />
          )}
          {!isExpanded && (
            <span className="text-xs text-muted-foreground/70">
              {reasoningInfo.wordCount} words
            </span>
          )}
        </div>
        {reasoningInfo.hasMoreContent && (
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="px-3 py-2 border-t border-border/30">
          <div className="text-sm text-muted-foreground font-mono leading-relaxed">
            <MarkdownRenderer content={text} />
          </div>
        </div>
      )}
    </div>
  )
})
