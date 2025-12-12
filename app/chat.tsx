'use client';

import type { ChatUIMessage } from '@/components/chat/types';
import { TEST_PROMPTS } from '@/ai/constants';
import {
    ChevronDownIcon,
    CheckIcon,
    DownloadIcon,
    EditIcon,
    ImageUpIcon,
    MessageCircleIcon,
    PlusIcon,
    SendIcon,
    Trash2Icon,
    UploadCloudIcon,
} from 'lucide-react';

import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
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
import { useLocalStorageValue } from '@/lib/use-local-storage-value';
import {
    useCallback,
    useEffect,
    useMemo,
    memo,
    useRef,
    useState,
    type ChangeEvent,
} from 'react';
import { useSharedChatContext } from '@/lib/chat-context';
import { useSettings } from '@/components/settings/use-settings';
import { useSandboxStore } from './state';
import { cn } from '@/lib/utils';
import { usePersistentChatSession } from '@/lib/use-persistent-chat-session';
import type { ConversationRecord } from '@/lib/chat-storage';
import { toast } from 'sonner';

type Attachment = { file: File; url: string };

interface Props {
    className: string;
    modelId?: string;
}

export const Chat = memo(function Chat({ className }: Props) {
    const [input, setInput] = useLocalStorageValue('prompt-input', '');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const { chat } = useSharedChatContext();
    const { modelId, reasoningEffort } = useSettings();
    const {
        messages,
        sendMessage,
        status,
        conversations,
        activeConversation,
        selectConversation,
        startNewConversation,
        renameConversation,
        deleteConversation,
        exportConversation,
        exportAll,
        importFromPayloads,
        isHydrating,
    } = usePersistentChatSession({ chat, modelId, reasoningEffort });
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

    const handleSelectConversation = useCallback(
        async (conversationId: string) => {
            await selectConversation(conversationId);
            setAttachments([]);
            setInput('');
        },
        [selectConversation, setInput, setAttachments]
    );

    const handleStartNewConversation = useCallback(async () => {
        await startNewConversation();
        setAttachments([]);
        setInput('');
    }, [startNewConversation, setInput, setAttachments]);

    const handleRenameConversation = useCallback(async () => {
        if (!activeConversation) {
            return;
        }
        const nextTitle = window.prompt(
            'Rename conversation',
            activeConversation.title ?? 'New chat'
        );
        if (nextTitle && nextTitle.trim().length > 0) {
            await renameConversation(activeConversation.id, nextTitle.trim());
            toast.success('Conversation renamed');
        }
    }, [activeConversation, renameConversation]);

    const handleDeleteConversation = useCallback(async () => {
        if (!activeConversation) {
            return;
        }
        const confirmed = window.confirm(
            'Delete this conversation? This action cannot be undone.'
        );
        if (confirmed) {
            await deleteConversation(activeConversation.id);
            toast.success('Conversation deleted');
            setAttachments([]);
            setInput('');
        }
    }, [activeConversation, deleteConversation, setAttachments, setInput]);

    const handleExportConversation = useCallback(async () => {
        if (!activeConversation) {
            return;
        }
        const payload = await exportConversation(activeConversation.id);
        if (!payload) {
            toast.error('Unable to export conversation');
            return;
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${
            activeConversation.title?.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() ??
            'conversation'
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Conversation exported');
    }, [activeConversation, exportConversation]);

    const handleExportAll = useCallback(async () => {
        const payloads = await exportAll();
        if (payloads.length === 0) {
            toast.info('No conversations to export');
            return;
        }
        const blob = new Blob([JSON.stringify(payloads, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'conversations.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('All conversations exported');
    }, [exportAll]);

    const handleImportFiles = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) {
                return;
            }
            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                const payloads = Array.isArray(parsed) ? parsed : [parsed];
                await importFromPayloads(payloads);
                toast.success('Conversations imported');
            } catch (error) {
                console.error('Failed to import conversations', error);
                toast.error('Import failed. Ensure the file is a valid export.');
            } finally {
                event.target.value = '';
            }
        },
        [importFromPayloads]
    );

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
    const statusLabel = isHydrating ? 'hydrating' : status;
    const activeTitle = activeConversation?.title ?? 'New chat';

    const shouldShowEmptyState = stableMessages.length === 0 && !isHydrating;

    return (
        <Panel className={className}>
            <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFiles}
            />
            <PanelHeader>
                <div className="flex flex-1 items-center gap-2">
                    <ConversationPicker
                        conversations={conversations}
                        activeConversation={activeConversation}
                        onSelect={handleSelectConversation}
                        onCreate={handleStartNewConversation}
                        onRename={handleRenameConversation}
                        onDelete={handleDeleteConversation}
                        onExport={handleExportConversation}
                        onExportAll={handleExportAll}
                        onImport={() => importInputRef.current?.click()}
                        disabled={isHydrating}
                        title={activeTitle}
                        isCurrentConversationEmpty={shouldShowEmptyState}
                    />
                </div>
                <div className="ml-auto font-mono text-[10px] opacity-60">
                    [{statusLabel}]
                </div>
            </PanelHeader>

            {/* Messages Area */}
            {isHydrating ? (
                <div className="min-h-0 flex-1">
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 font-mono text-xs">
                        <span className="animate-pulse">Loading conversation…</span>
                    </div>
                </div>
            ) : shouldShowEmptyState ? (
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
                        {stableMessages.map(message => ( (
                            <Message key={message.id} message={message} />
                        )))}
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
                                isHydrating ||
                                status === 'streaming' ||
                                status === 'submitted'
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
                            disabled={isHydrating}
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
                                isHydrating ||
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

function useStableMessages(messages: ChatUIMessage[]) {
    const previousMessagesRef = useRef<Map<string, ChatUIMessage>>(new Map());

    // Keep message references stable so heavy children skip renders when data is unchanged.
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

interface ConversationSwitcherProps {
    conversations: ConversationRecord[];
    activeConversation?: ConversationRecord;
    onSelect: (conversationId: string) => void | Promise<void>;
    onCreate: () => void | Promise<void>;
    onRename: () => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onExportAll: () => void | Promise<void>;
    onImport: () => void;
    disabled?: boolean;
    title: string;
    isCurrentConversationEmpty: boolean;
}

function ConversationPicker({
    conversations,
    activeConversation,
    onSelect,
    onCreate,
    onRename,
    onDelete,
    onExport,
    onExportAll,
    onImport,
    disabled,
    title,
    isCurrentConversationEmpty,
}: ConversationSwitcherProps) {
    const [open, setOpen] = useState(false);

    // Filter out duplicates based on ID just in case, though conversations should be unique by ID
    const uniqueConversations = conversations;

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-2 font-mono text-[11px] font-semibold tracking-wide uppercase hover:bg-muted/50"
                disabled={disabled}
            >
                <MessageCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[140px] truncate text-muted-foreground">
                    {title}
                </span>
                <ChevronDownIcon className="h-3 w-3 text-muted-foreground/50" />
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search conversations..." />
                <CommandList>
                    <CommandEmpty>No conversations found.</CommandEmpty>
                    {!isCurrentConversationEmpty && (
                        <>
                            <CommandGroup heading="Actions">
                                <CommandItem
                                    onSelect={() => {
                                        onCreate();
                                        setOpen(false);
                                    }}
                                >
                                    <PlusIcon className="mr-2 h-3.5 w-3.5" />
                                    New conversation
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}
                    <CommandGroup heading="Conversations">
                        {conversations.map(conversation => (
                            <CommandItem
                                key={conversation.id}
                                value={`${conversation.title || 'New chat'} ${conversation.id}`}
                                onSelect={() => {
                                    void onSelect(conversation.id);
                                    setOpen(false);
                                }}
                                className="gap-2"
                            >
                                <span className="truncate flex-1">
                                    {conversation.title || 'New chat'}
                                </span>
                                {conversation.id === activeConversation?.id && (
                                    <CheckIcon className="ml-auto h-3.5 w-3.5 opacity-100" />
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
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

function areStringArraysEqual(first: string[], second: string[]): boolean {
    if (first.length !== second.length) {
        return false;
    }

    for (let index = 0; index < first.length; index += 1) {
        if (first[index] !== second[index]) {
            return false;
        }
    }

    return true;
}

function areOptionalStringArraysEqual(
    first: string[] | undefined,
    second: string[] | undefined
): boolean {
    if (!first && !second) {
        return true;
    }

    if (!first || !second) {
        return false;
    }

    return areStringArraysEqual(first, second);
}