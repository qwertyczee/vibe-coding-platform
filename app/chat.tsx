'use client';

import type { ChatUIMessage } from '@/components/chat/types';
import { TEST_PROMPTS } from '@/ai/constants';
import {
    ImageUpIcon,
    MessageCircleIcon,
    PaperclipIcon,
    SendIcon,
    SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@/components/chat/message';
import { Panel, PanelHeader, type PanelTone } from '@/components/panels/panels';
import { Settings } from '@/components/settings/settings';
import { useChat } from '@ai-sdk/react';
import { useLocalStorageValue } from '@/lib/use-local-storage-value';
import {
    useCallback,
    useEffect,
    useMemo,
    memo,
    useRef,
    useState,
} from 'react';
import { useSharedChatContext } from '@/lib/chat-context';
import { useSettings } from '@/components/settings/use-settings';
import { useSandboxStore } from './state';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type Attachment = { file: File; url: string };

interface Props {
    className?: string;
    modelId?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export const Chat = memo(function Chat({
    className,
    tone = 'glass',
    glow = true,
}: Props) {
    const [input, setInput] = useLocalStorageValue('prompt-input', '');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { chat } = useSharedChatContext();
    const { modelId, reasoningEffort } = useSettings();
    const { messages, sendMessage, status } = useChat<ChatUIMessage>({ chat });
    const stableMessages = useStableMessages(messages);
    const { setChatStatus } = useSandboxStore();

    const validateAndSubmitMessage = useCallback(
        (text: string) => {
            if (text.trim()) {
                sendMessage({ text }, { body: { modelId, reasoningEffort } });
                setInput('');
                setAttachments([]);
            }
        },
        [sendMessage, modelId, setInput, reasoningEffort]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            validateAndSubmitMessage(input);
        },
        [validateAndSubmitMessage, input]
    );

    const handlePickImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(f =>
            f.type.startsWith('image/')
        );
        if (files.length) {
            const mapped: Attachment[] = files.map(file => ({
                file,
                url: URL.createObjectURL(file),
            }));
            setAttachments(prev => [...prev, ...mapped]);
        }
        e.target.value = '';
    }, []);

    const attachmentCount = useMemo(() => attachments.length, [attachments]);

    useEffect(() => {
        setChatStatus(status);
    }, [status, setChatStatus]);

    const textareaClass = useMemo(
        () =>
            cn(
                'w-full resize-none border-0 bg-transparent px-0 text-sm leading-relaxed text-foreground/90 placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-0',
                attachmentCount > 0 ? 'pt-4 pb-3' : 'py-2'
            ),
        [attachmentCount]
    );

    const quickPrompts = useMemo(() => TEST_PROMPTS.slice(0, 4), []);

    return (
        <Panel tone={tone} glow={glow} className={cn('chat-panel', className)}>
            <PanelHeader tone="accent" className="flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-[0_18px_40px_-24px_rgba(255,255,255,0.65)]">
                        <MessageCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.48em] text-white/70">
                            Assistant
                        </span>
                        <span className="text-xs font-medium tracking-[0.24em] text-white/70">
                            Conversational canvas
                        </span>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    <span className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1">
                        <span className="h-2 w-2 rounded-full bg-[rgba(58,210,159,0.9)]" />
                        {status}
                    </span>
                    <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 sm:flex">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        {modelId ?? 'Auto model'}
                    </span>
                </div>
            </PanelHeader>

            <div className="flex flex-1 flex-col overflow-hidden px-4 py-5 md:px-6 md:py-6">
                {stableMessages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center text-sm text-foreground/70">
                        <div className="max-w-sm space-y-2">
                            <h2 className="text-lg font-semibold text-white">
                                Ready to build?
                            </h2>
                            <p>
                                Try one of the curated prompts below or ask the assistant
                                anything about your next project.
                            </p>
                        </div>
                        <div className="grid w-full gap-3 sm:grid-cols-2">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => validateAndSubmitMessage(prompt)}
                                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-200/50 px-5 py-4 text-left transition hover:border-white/30 hover:shadow-[0_30px_90px_-45px_rgba(75,139,255,0.65)]"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(75,139,255,0.15),transparent_70%)] opacity-0 transition group-hover:opacity-100" />
                                    <div className="relative flex items-start gap-3">
                                        <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white/80">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm text-white/80">
                                            {prompt}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Conversation className="relative flex-1">
                        <ConversationContent className="space-y-6 pb-16">
                            {stableMessages.map(message => (
                                <Message key={message.id} message={message} />
                            ))}
                        </ConversationContent>
                        <ConversationScrollButton className="bg-white/10 text-white hover:bg-white/20" />
                    </Conversation>
                )}
            </div>

            <div className="space-y-4 border-t border-white/5 bg-surface-200/40 px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5">
                <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, idx) => (
                        <Button
                            key={idx}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full border border-white/10 bg-white/5 text-xs text-white/70 hover:border-white/30 hover:bg-white/10"
                            onClick={() => validateAndSubmitMessage(prompt)}
                        >
                            {prompt.length > 32
                                ? `${prompt.slice(0, 32)}…`
                                : prompt}
                        </Button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative rounded-3xl border border-white/12 bg-surface-300/40 p-4 shadow-[0_35px_120px_-60px_rgba(9,16,40,0.95)] backdrop-blur-2xl transition focus-within:border-white/40 focus-within:ring-2 focus-within:ring-[rgba(75,139,255,0.4)]">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onFilesSelected}
                        />
                        {attachmentCount > 0 ? (
                            <ScrollArea className="mb-3 whitespace-nowrap">
                                <div className="flex gap-3">
                                    {attachments.map((att, i) => (
                                        <div
                                            key={`${att.url}-${i}`}
                                            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_12px_40px_-24px_rgba(75,139,255,0.45)]"
                                        >
                                            <img
                                                src={att.url}
                                                alt={`attachment-${i + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" className="hidden" />
                            </ScrollArea>
                        ) : null}

                        <Textarea
                            aria-label="Message"
                            rows={attachmentCount > 0 ? 4 : 3}
                            className={textareaClass}
                            disabled={status === 'streaming' || status === 'submitted'}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Describe what you want to build or ask a question"
                            value={input}
                        />

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 rounded-full border border-white/10 bg-white/10 text-xs text-white/80 hover:bg-white/20"
                                onClick={handlePickImage}
                                title="Upload image"
                                aria-label="Upload image"
                            >
                                <ImageUpIcon className="mr-2 h-4 w-4" />
                                Attach
                                {attachmentCount > 0 ? (
                                    <span className="ml-2 rounded-full bg-white/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                                        {attachmentCount}
                                    </span>
                                ) : null}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 rounded-full border border-white/10 bg-white/10 text-xs text-white/80 hover:bg-white/20"
                                onClick={() => validateAndSubmitMessage('Generate a project summary of recent changes.')}
                            >
                                <PaperclipIcon className="mr-2 h-4 w-4" />
                                Summarise changes
                            </Button>

                            <Settings />

                            <Button
                                type="submit"
                                size="sm"
                                className="ml-auto h-10 rounded-full bg-[linear-gradient(135deg,rgba(75,139,255,0.95),rgba(155,107,255,0.85))] px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_25px_80px_-45px_rgba(75,139,255,0.85)] hover:opacity-90"
                                disabled={
                                    status !== 'ready' || (!input.trim() && attachmentCount === 0)
                                }
                                title="Send"
                                aria-label="Send message"
                            >
                                <SendIcon className="mr-2 h-4 w-4" />
                                Send
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Panel>
    );
});

function useStableMessages(messages: ChatUIMessage[]) {
    const previousMessagesRef = useRef<Map<string, ChatUIMessage>>(new Map());

    return useMemo(() => {
        const nextMessageMap = new Map<string, ChatUIMessage>();

        const stableList = messages.map(message => {
            const previous = previousMessagesRef.current.get(message.id);

            if (previous && areMessagesEqual(previous, message)) {
                nextMessageMap.set(message.id, previous);
                return previous;
            }

            nextMessageMap.set(message.id, message);
            return message;
        });

        previousMessagesRef.current = nextMessageMap;

        return stableList;
    }, [messages]);
}

function areMessagesEqual(previous: ChatUIMessage, next: ChatUIMessage): boolean {
    if (previous === next) {
        return true;
    }

    if (previous.id !== next.id || previous.role !== next.role) {
        return false;
    }

    if ((previous.metadata?.model ?? null) !== (next.metadata?.model ?? null)) {
        return false;
    }

    return areMessagePartsEqual(previous.parts, next.parts);
}

function areMessagePartsEqual(
    previousParts: ChatUIMessage['parts'],
    nextParts: ChatUIMessage['parts']
): boolean {
    if (previousParts.length !== nextParts.length) {
        return false;
    }

    for (let index = 0; index < previousParts.length; index += 1) {
        const previousPart = previousParts[index]!;
        const nextPart = nextParts[index]!;

        if (previousPart === nextPart) {
            continue;
        }

        if (previousPart.type !== nextPart.type) {
            return false;
        }

        switch (previousPart.type) {
            case 'text': {
                if (previousPart.text !== (nextPart as typeof previousPart).text) {
                    return false;
                }
                break;
            }
            case 'reasoning': {
                const nextReasoning = nextPart as typeof previousPart;

                if (
                    (previousPart.text ?? '') !== (nextReasoning.text ?? '') ||
                    previousPart.state !== nextReasoning.state
                ) {
                    return false;
                }
                break;
            }
            case 'data-generating-files': {
                const prevData = previousPart.data;
                const nextData = (nextPart as typeof previousPart).data;

                if (
                    prevData.status !== nextData.status ||
                    !areStringArraysEqual(prevData.paths, nextData.paths) ||
                    (prevData.error?.message ?? null) !==
                        (nextData.error?.message ?? null)
                ) {
                    return false;
                }
                break;
            }
            case 'data-create-sandbox': {
                const prevData = previousPart.data;
                const nextData = (nextPart as typeof previousPart).data;

                if (
                    prevData.status !== nextData.status ||
                    prevData.sandboxId !== nextData.sandboxId ||
                    (prevData.error?.message ?? null) !==
                        (nextData.error?.message ?? null)
                ) {
                    return false;
                }
                break;
            }
            case 'data-get-sandbox-url': {
                const prevData = previousPart.data;
                const nextData = (nextPart as typeof previousPart).data;

                if (
                    prevData.status !== nextData.status ||
                    (prevData.url ?? null) !== (nextData.url ?? null)
                ) {
                    return false;
                }
                break;
            }
            case 'data-run-command': {
                const prevData = previousPart.data;
                const nextData = (nextPart as typeof previousPart).data;

                if (
                    prevData.status !== nextData.status ||
                    prevData.sandboxId !== nextData.sandboxId ||
                    (prevData.commandId ?? null) !== (nextData.commandId ?? null) ||
                    prevData.command !== nextData.command ||
                    !areStringArraysEqual(prevData.args, nextData.args) ||
                    (prevData.exitCode ?? null) !== (nextData.exitCode ?? null) ||
                    (prevData.error?.message ?? null) !==
                        (nextData.error?.message ?? null)
                ) {
                    return false;
                }
                break;
            }
            case 'data-report-errors': {
                const prevData = previousPart.data;
                const nextData = (nextPart as typeof previousPart).data;

                if (
                    prevData.summary !== nextData.summary ||
                    !areOptionalStringArraysEqual(prevData.paths, nextData.paths)
                ) {
                    return false;
                }
                break;
            }
            default:
                return false;
        }
    }

    return true;
}

function areStringArraysEqual(arrayA?: string[], arrayB?: string[]) {
    if (!arrayA && !arrayB) {
        return true;
    }

    if (!arrayA || !arrayB || arrayA.length !== arrayB.length) {
        return false;
    }

    for (let index = 0; index < arrayA.length; index += 1) {
        if (arrayA[index] !== arrayB[index]) {
            return false;
        }
    }

    return true;
}

function areOptionalStringArraysEqual(arrayA?: string[], arrayB?: string[]) {
    if (!arrayA && !arrayB) {
        return true;
    }

    if (!arrayA || !arrayB || arrayA.length !== arrayB.length) {
        return false;
    }

    for (let index = 0; index < arrayA.length; index += 1) {
        if (arrayA[index] !== arrayB[index]) {
            return false;
        }
    }

    return true;
}
