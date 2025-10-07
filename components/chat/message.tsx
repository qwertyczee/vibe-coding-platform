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
    useCallback,
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

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            expandedReasoningIndex,
            setExpandedReasoningIndex,
            autoExpand,
            setAutoExpand,
        }),
        [expandedReasoningIndex, autoExpand]
    );

    // Memoize the class name calculation
    const messageClassName = useMemo(
        () =>
            cn({
                'mr-20': message.role === 'assistant',
                'ml-20': message.role === 'user',
            }),
        [message.role]
    );

    // Memoize the header content
    const headerContent = useMemo(() => {
        if (message.role === 'user') {
            return (
                <>
                    <UserIcon className="ml-auto w-4" />
                    <span>You</span>
                </>
            );
        } else {
            return (
                <>
                    <BotIcon className="w-4" />
                    <span>Assistant ({message.metadata?.model})</span>
                </>
            );
        }
    }, [message.role, message.metadata?.model]);

    return (
        <ReasoningContext.Provider value={contextValue}>
            <div className={messageClassName}>
                {/* Message Header */}
                <div className="text-primary mb-1.5 flex items-center gap-2 font-mono text-sm font-medium">
                    {headerContent}
                </div>

                {/* Message Content */}
                <div className="space-y-1.5">
                    {message.parts.map((part, index) => (
                        <MessagePart
                            key={index}
                            part={part}
                            partIndex={index}
                        />
                    ))}
                </div>
            </div>
        </ReasoningContext.Provider>
    );
});
