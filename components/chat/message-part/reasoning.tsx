import type { ReasoningUIPart } from 'ai';
import { MarkdownRenderer } from '@/components/markdown-renderer/markdown-renderer';
import { MessageSpinner } from '../message-spinner';
import { useReasoningContext } from '../message';
import { memo, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, BrainIcon } from 'lucide-react';

export const Reasoning = memo(function Reasoning({
    part,
    partIndex,
}: {
    part: ReasoningUIPart;
    partIndex: number;
}) {
    const context = useReasoningContext();
    const isExpanded = context?.expandedReasoningIndex === partIndex;

    if (part.state === 'done' && !part.text) {
        return null;
    }

    const text = part.text || '_Thinking_';
    const isStreaming = part.state === 'streaming';

    const reasoningInfo = useMemo(() => {
        const firstLine = text.split('\n')[0].replace(/\*\*/g, '');
        const hasMoreContent = text.includes('\n') || text.length > 80;
        const wordCount = text.split(/\s+/).length;
        return { firstLine, hasMoreContent, wordCount };
    }, [text]);

    const handleToggle = useCallback(() => {
        if (context) {
            const newIndex = isExpanded ? null : partIndex;
            context.setExpandedReasoningIndex(newIndex);
            // Disable auto-expand when user manually toggles
            if (context.autoExpand) {
                context.setAutoExpand(false);
            }
        }
    }, [isExpanded, partIndex, context]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
            }
        },
        [handleToggle]
    );

    return (
        <div className="border-border/50 bg-muted/30 overflow-hidden rounded-md border">
            <div
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors select-none"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`Reasoning ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
                <BrainIcon className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-muted-foreground text-sm font-medium">
                        Reasoning
                    </span>
                    {isStreaming && <MessageSpinner />}
                    {!isExpanded && (
                        <span className="text-muted-foreground/70 text-xs">
                            {reasoningInfo.wordCount} words
                        </span>
                    )}
                </div>
                {reasoningInfo.hasMoreContent && (
                    <div className="flex items-center gap-1">
                        {isExpanded ? (
                            <ChevronDownIcon className="text-muted-foreground h-4 w-4" />
                        ) : (
                            <ChevronRightIcon className="text-muted-foreground h-4 w-4" />
                        )}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="border-border/30 border-t px-3 py-2">
                    <div className="text-muted-foreground font-mono text-sm leading-relaxed">
                        <MarkdownRenderer content={text} />
                    </div>
                </div>
            )}
        </div>
    );
});
