import type { ChatUIMessage } from './types';
import { MessagePart } from './message-part';
import { BotIcon, UserIcon } from 'lucide-react';
import {
    memo,
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
} from 'react';
import { cn } from '@/lib/utils';

interface Props {
    message: ChatUIMessage;
}

interface ReasoningContextType {
    expandedReasoningIndex: number | null;
    setExpandedReasoningIndex: (index: number | null) => void;
    autoExpand: boolean;
    setAutoExpand: (autoExpand: boolean) => void;
}

const ReasoningContext = createContext<ReasoningContextType | null>(null);

export const useReasoningContext = () => {
    const context = useContext(ReasoningContext);
    return context;
};

export const Message = memo(function Message({ message }: Props) {
    const [expandedReasoningIndex, setExpandedReasoningIndex] = useState<
        number | null
    >(null);
    const [autoExpand, setAutoExpand] = useState(true);

    const reasoningParts = useMemo(
        () =>
            message.parts
                .map((part, index) => ({ part, index }))
                .filter(({ part }) => part.type === 'reasoning'),
        [message.parts]
    );

    useEffect(() => {
        if (reasoningParts.length > 0 && autoExpand) {
            const latestReasoningIndex =
                reasoningParts[reasoningParts.length - 1].index;
            setExpandedReasoningIndex(latestReasoningIndex);
        }
    }, [reasoningParts, autoExpand]);

    const contextValue = useMemo(
        () => ({
            expandedReasoningIndex,
            setExpandedReasoningIndex,
            autoExpand,
            setAutoExpand,
        }),
        [expandedReasoningIndex, autoExpand]
    );

    const isAssistant = message.role === 'assistant';
    const timestamp = useMemo(() => {
        if (!message.createdAt) {
            return null;
        }
        try {
            return new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return null;
        }
    }, [message.createdAt]);

    const badgeList = useMemo(() => {
        const badges: string[] = [];
        if (isAssistant && message.metadata?.model) {
            badges.push(`Model · ${message.metadata.model}`);
        }
        if (timestamp) {
            badges.push(`at ${timestamp}`);
        }
        return badges;
    }, [isAssistant, message.metadata?.model, timestamp]);

    return (
        <ReasoningContext.Provider value={contextValue}>
            <div
                className={cn(
                    'flex w-full',
                    isAssistant ? 'justify-start' : 'justify-end'
                )}
            >
                <div
                    className={cn(
                        'flex max-w-[min(640px,90%)] flex-col gap-3',
                        isAssistant
                            ? 'items-start text-left'
                            : 'items-end text-right'
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/50',
                            isAssistant ? 'flex-row' : 'flex-row-reverse'
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-xl',
                                isAssistant
                                    ? 'border-[rgba(75,139,255,0.35)] bg-[linear-gradient(135deg,rgba(75,139,255,0.45),rgba(155,107,255,0.35))] text-white shadow-[0_20px_60px_-35px_rgba(75,139,255,0.75)]'
                                    : 'border-white/10 bg-white/10 text-white/80 shadow-[0_16px_45px_-32px_rgba(12,16,32,0.75)]'
                            )}
                        >
                            {isAssistant ? (
                                <BotIcon className="h-4 w-4" />
                            ) : (
                                <UserIcon className="h-4 w-4" />
                            )}
                        </div>
                        <span>
                            {isAssistant
                                ? `Assistant${message.metadata?.model ? '' : ''}`
                                : 'You'}
                        </span>
                    </div>

                    <div
                        className={cn(
                            'relative w-full overflow-hidden rounded-[24px] border px-5 py-4 text-sm leading-relaxed shadow-[0_35px_120px_-70px_rgba(75,139,255,0.85)] backdrop-blur-xl transition',
                            isAssistant
                                ? 'border-white/15 bg-white/10 text-white/90'
                                : 'border-white/8 bg-accent/40 text-foreground/90'
                        )}
                    >
                        <div className="space-y-3">
                            {message.parts.map((part, index) => (
                                <MessagePart
                                    key={index}
                                    part={part}
                                    partIndex={index}
                                />
                            ))}
                        </div>
                    </div>

                    {badgeList.length > 0 ? (
                        <div
                            className={cn(
                                'flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em]',
                                isAssistant ? 'text-white/45' : 'text-white/40'
                            )}
                        >
                            {badgeList.map((badge, index) => (
                                <span
                                    key={`${badge}-${index}`}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </ReasoningContext.Provider>
    );
});
