'use client';

import type { ChatUIMessage } from '@/components/chat/types';
import { TEST_PROMPTS } from '@/ai/constants';
import { ImageUpIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@/components/chat/message';
import { Panel, PanelHeader } from '@/components/panels/panels';
import { Settings } from '@/components/settings/settings';
import { useChat } from '@ai-sdk/react';
import { useLocalStorageValue } from '@/lib/use-local-storage-value';
import { useCallback, useEffect, useMemo, memo, useRef, useState } from 'react';
import { useSharedChatContext } from '@/lib/chat-context';
import { useSettings } from '@/components/settings/use-settings';
import { useSandboxStore } from './state';
import { cn } from '@/lib/utils';

type Attachment = { file: File; url: string };

interface Props {
    className: string;
    modelId?: string;
}

export const Chat = memo(function Chat({ className }: Props) {
    const [input, setInput] = useLocalStorageValue('prompt-input', '');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { chat } = useSharedChatContext();
    const { modelId, reasoningEffort } = useSettings();
    const { messages, sendMessage, status } = useChat<ChatUIMessage>({ chat });
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

    const onFilesSelected = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
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
        },
        []
    );

    const attachmentCount = useMemo(() => attachments.length, [attachments]);

    useEffect(() => {
        setChatStatus(status);
    }, [status, setChatStatus]);

    const textareaClass = useMemo(
        () =>
            cn(
                'w-full font-mono text-[12px] leading-relaxed',
                'rounded-lg px-3',
                attachmentCount > 0 ? 'pt-14 pb-2' : 'py-2',
                'bg-[#0f1113] border border-[#2c3038]',
                'placeholder:text-[#7d828b]',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                'focus-visible:ring-[3px] focus-visible:ring-[#4a505a] focus-visible:border-[#4a505a]',
                'resize-y min-h-24 max-h-60'
            ),
        [attachmentCount]
    );

    // Memoize the test prompts to prevent re-creation on every render
    const testPrompts = useMemo(() => TEST_PROMPTS, []);

    return (
        <Panel className={className}>
            <PanelHeader>
                <div className="text-muted-foreground flex items-center font-mono text-[11px] font-semibold tracking-wide uppercase">
                    <MessageCircleIcon className="mr-2 h-3.5 w-3.5" />
                    Chat
                </div>
                <div className="ml-auto font-mono text-[10px] opacity-60">
                    [{status}]
                </div>
            </PanelHeader>

            {/* Messages Area */}
            {messages.length === 0 ? (
                <div className="min-h-0 flex-1">
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center font-mono text-xs">
                        <p className="mb-2 font-semibold">
                            Click and try one of these prompts:
                        </p>
                        <ul className="space-y-1 p-3 text-center">
                            {testPrompts.map((prompt, idx) => (
                                <li
                                    key={idx}
                                    className="border-border/80 bg-muted/30 hover:bg-muted hover:text-foreground cursor-pointer rounded-sm border border-dashed px-3 py-2 shadow-sm"
                                    onClick={() =>
                                        validateAndSubmitMessage(prompt)
                                    }
                                >
                                    {prompt}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <Conversation className="relative w-full">
                    <ConversationContent className="space-y-4">
                        {messages.map(message => (
                            <Message key={message.id} message={message} />
                        ))}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>
            )}

            {/* Composer */}
            <form
                onSubmit={handleSubmit}
                className="border-border/80 bg-background/90 border-t"
            >
                {/* Text input area with inline attachment previews */}
                <div className="p-2">
                    <div className="relative">
                        {/* Inline previews inside the textbox area (top-left) */}
                        {attachmentCount > 0 && (
                            <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2">
                                {attachments.slice(0, 4).map((att, i) => (
                                    <img
                                        key={`${att.url}-${i}`}
                                        src={att.url}
                                        alt={`attachment-${i + 1}`}
                                        className="h-10 w-10 rounded-md border border-[#2c3038] object-cover shadow-xs"
                                    />
                                ))}
                                {attachmentCount > 4 && (
                                    <div className="grid h-10 w-10 place-items-center rounded-md border border-[#2c3038] bg-[#171a1f] text-[10px] font-medium text-[#a3a9b3] shadow-xs">
                                        +{attachmentCount - 4}
                                    </div>
                                )}
                            </div>
                        )}

                        <Textarea
                            aria-label="Message"
                            rows={4}
                            className={textareaClass}
                            disabled={
                                status === 'streaming' || status === 'submitted'
                            }
                            onChange={e => setInput(e.target.value)}
                            placeholder="What to vibe?"
                            value={input}
                        />
                    </div>
                </div>

                {/* Controls bar */}
                <div className="flex items-center gap-2 px-2 pb-2">
                    {/* Left controls */}
                    <div className="flex items-center gap-1.5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onFilesSelected}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md px-2 text-[10.5px]"
                            onClick={handlePickImage}
                            title="Upload image"
                            aria-label="Upload image"
                        >
                            <ImageUpIcon className="h-3.5 w-3.5" />
                            {attachmentCount > 0 ? (
                                <span className="ml-1 tabular-nums">
                                    {attachmentCount}
                                </span>
                            ) : null}
                        </Button>

                        <Settings />
                    </div>

                    {/* Right send */}
                    <div className="ml-auto">
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-secondary border-border hover:bg-secondary/80 h-7 rounded-md border px-2 text-[10.5px] font-medium"
                            disabled={
                                status !== 'ready' ||
                                (!input.trim() && attachmentCount === 0)
                            }
                            title="Send"
                            aria-label="Send message"
                        >
                            <SendIcon className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </form>
        </Panel>
    );
});
