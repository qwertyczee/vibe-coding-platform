'use client';

import type { ChatUIMessage } from '@/components/chat/types';
import { TEST_PROMPTS } from '@/ai/constants';
import {
    DownloadIcon,
    ImageUpIcon,
    MessageCircleIcon,
    MoreHorizontalIcon,
    PlusIcon,
    SendIcon,
    Settings2Icon,
    Trash2Icon,
    UploadCloudIcon,
    EditIcon,
} from 'lucide-react';
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
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from 'react';
import { useSharedChatContext } from '@/lib/chat-context';
import { useSettings } from '@/components/settings/use-settings';
import { useSandboxStore } from './state';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersistentChatSession } from '@/lib/use-persistent-chat-session';
import type { ConversationRecord } from '@/lib/chat-storage';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Attachment {
    file: File;
    url: string;
}

interface Props {
    className?: string;
    chatId: string;
}

export const Chat = memo(function Chat({ className, chatId }: Props) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [pendingDeleteConversation, setPendingDeleteConversation] =
        useState<ConversationRecord | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

    const { chat } = useSharedChatContext();
    const { modelId, reasoningEffort } = useSettings();
    const [input, setInput] = useLocalStorageValue(`prompt-input:${chatId}`, '');

    const {
        messages,
        status,
        sendMessage,
        conversations,
        currentConversation,
        isHydrating,
        hasHydratedOnce,
        refreshConversations,
        createConversation,
        renameConversation,
        deleteConversation,
        deleteAllConversations,
        exportConversation,
        exportAll,
        importFromPayloads,
    } = usePersistentChatSession({
        chat,
        conversationId: chatId,
        modelId,
        reasoningEffort,
    });
    const stableMessages = useStableMessages(messages);
    const { setChatStatus } = useSandboxStore();

    useEffect(() => {
        setAttachments([]);
    }, [chatId]);

    useEffect(() => {
        setChatStatus(status);
    }, [status, setChatStatus]);

    const creatingFallbackRef = useRef(false);
    useEffect(() => {
        if (!hasHydratedOnce || creatingFallbackRef.current) {
            return;
        }
        if (currentConversation) {
            return;
        }
        if (conversations.length > 0) {
            router.replace(`/${conversations[0]!.id}`);
            return;
        }
        if (!chatId) {
            return;
        }
        creatingFallbackRef.current = true;
        void createConversation()
            .then(newConversation => {
                router.replace(`/${newConversation.id}`);
            })
            .finally(() => {
                creatingFallbackRef.current = false;
            });
    }, [chatId, conversations, createConversation, currentConversation, hasHydratedOnce, router]);

    const attachmentCount = useMemo(() => attachments.length, [attachments]);

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
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            validateAndSubmitMessage(input);
        },
        [validateAndSubmitMessage, input]
    );

    const handlePickImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFilesSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).filter(file =>
            file.type.startsWith('image/')
        );
        if (files.length) {
            const mapped: Attachment[] = files.map(file => ({
                file,
                url: URL.createObjectURL(file),
            }));
            setAttachments(previous => [...previous, ...mapped]);
        }
        event.target.value = '';
    }, []);

    const handleNavigateToConversation = useCallback(
        (conversationId: string) => {
            if (!conversationId || conversationId === chatId) {
                return;
            }
            router.push(`/${conversationId}`);
        },
        [chatId, router]
    );

    const handleStartNewConversation = useCallback(async () => {
        const newConversation = await createConversation();
        router.push(`/${newConversation.id}`);
        setAttachments([]);
    }, [createConversation, router]);

    const handlePromptClick = useCallback(
        (prompt: string) => {
            setInput(prompt);
            validateAndSubmitMessage(prompt);
        },
        [setInput, validateAndSubmitMessage]
    );

    const handleExportConversation = useCallback(
        async (conversation: ConversationRecord) => {
            const payload = await exportConversation(conversation.id);
            if (!payload) {
                toast.error('Unable to export conversation');
                return;
            }
            const fileName = `${
                conversation.title?.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() ?? 'conversation'
            }.json`;
            downloadPayload(payload, fileName);
            toast.success('Conversation exported');
        },
        [exportConversation]
    );

    const handleExportAll = useCallback(async () => {
        const payloads = await exportAll();
        if (payloads.length === 0) {
            toast.info('No conversations to export');
            return;
        }
        downloadPayload(payloads, 'conversations.json');
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
                await refreshConversations();
                toast.success('Conversations imported');
            } catch (error) {
                console.error('Failed to import conversations', error);
                toast.error('Import failed. Please select a valid export file.');
            } finally {
                event.target.value = '';
            }
        },
        [importFromPayloads, refreshConversations]
    );

    const handleRenameConversation = useCallback(
        async (conversation: ConversationRecord) => {
            const nextTitle = window.prompt('Rename conversation', conversation.title ?? 'New chat');
            if (!nextTitle) {
                return;
            }
            await renameConversation(conversation.id, nextTitle.trim());
            toast.success('Conversation renamed');
        },
        [renameConversation]
    );

    const handleDeleteConversationConfirm = useCallback(async () => {
        if (!pendingDeleteConversation) {
            return;
        }
        const conversationId = pendingDeleteConversation.id;
        const fallback = conversations.find(conversation => conversation.id !== conversationId);
        await deleteConversation(conversationId);
        toast.success('Conversation deleted');
        setPendingDeleteConversation(null);
        if (chatId === conversationId) {
            if (fallback) {
                router.replace(`/${fallback.id}`);
            } else {
                const created = await createConversation();
                router.replace(`/${created.id}`);
            }
        }
    }, [pendingDeleteConversation, conversations, deleteConversation, chatId, router, createConversation]);

    const handleDeleteAllConversations = useCallback(async () => {
        await deleteAllConversations();
        const created = await createConversation();
        router.replace(`/${created.id}`);
        setInput('');
        setAttachments([]);
        toast.success('All conversations deleted');
    }, [createConversation, deleteAllConversations, router, setInput]);

    const groupedConversations = useMemo(
        () => groupConversations(conversations),
        [conversations]
    );

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

    const testPrompts = useMemo(() => TEST_PROMPTS, []);
    const statusLabel = isHydrating ? 'hydrating' : status;
    const shouldShowEmptyState = stableMessages.length === 0 && !isHydrating;

    return (
        <div className={cn('flex h-full gap-2', className)}>
            <aside className="border-border/80 bg-background/80 flex h-full w-72 flex-col rounded-sm border p-2">
                <div className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <MessageCircleIcon className="h-4 w-4" />
                        Conversations
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleStartNewConversation}>
                        <PlusIcon className="h-4 w-4" />
                        <span className="sr-only">New chat</span>
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="space-y-4 pr-2">
                        {groupedConversations.length === 0 ? (
                            <div className="text-muted-foreground rounded-sm border border-dashed p-4 text-xs">
                                Conversations you create will appear here.
                            </div>
                        ) : (
                            groupedConversations.map(group => (
                                <div key={group.label} className="space-y-2">
                                    <p className="text-muted-foreground px-1 text-[11px] font-semibold uppercase tracking-wide">
                                        {group.label}
                                    </p>
                                    <div className="space-y-1">
                                        {group.conversations.map(conversation => (
                                            <ConversationSidebarItem
                                                key={conversation.id}
                                                conversation={conversation}
                                                isActive={conversation.id === chatId}
                                                onSelect={handleNavigateToConversation}
                                                onRename={handleRenameConversation}
                                                onDelete={setPendingDeleteConversation}
                                                onExport={handleExportConversation}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="mt-3 border-t pt-3">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-sm"
                                type="button"
                            >
                                <Settings2Icon className="h-4 w-4" />
                                Chat settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Chat settings</DialogTitle>
                                <DialogDescription>
                                    Manage your local conversations.
                                </DialogDescription>
                            </DialogHeader>
                            <input
                                ref={importInputRef}
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={handleImportFiles}
                            />
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={handleExportAll}
                                    type="button"
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                    Export all chats
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => importInputRef.current?.click()}
                                    type="button"
                                >
                                    <UploadCloudIcon className="h-4 w-4" />
                                    Import chats
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start gap-2"
                                    onClick={() => setConfirmDeleteAllOpen(true)}
                                    type="button"
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                    Delete all chats
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </aside>

            <Panel className="flex-1 overflow-hidden">
                <PanelHeader>
                    <div className="flex flex-1 items-center gap-2">
                        <div className="text-muted-foreground flex items-center font-mono text-[11px] font-semibold tracking-wide uppercase">
                            <MessageCircleIcon className="mr-2 h-3.5 w-3.5" />
                            {currentConversation?.title || 'Chat'}
                        </div>
                    </div>
                    <div className="ml-auto font-mono text-[10px] opacity-60">[{statusLabel}]</div>
                </PanelHeader>

                <div className="flex h-full flex-1 flex-col">
                    {isHydrating ? (
                        <div className="min-h-0 flex-1">
                            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 font-mono text-xs">
                                <span className="animate-pulse">Loading conversation…</span>
                            </div>
                        </div>
                    ) : shouldShowEmptyState ? (
                        <div className="min-h-0 flex-1">
                            <div className="text-muted-foreground flex h-full flex-col items-center justify-center font-mono text-xs">
                                <p className="mb-2 font-semibold">Try one of these prompts:</p>
                                <ul className="space-y-1 p-3 text-center">
                                    {testPrompts.map((prompt, index) => (
                                        <li
                                            key={index}
                                            className="border-border/80 bg-muted/30 hover:bg-muted hover:text-foreground cursor-pointer rounded-sm border border-dashed px-3 py-2 shadow-sm"
                                            onClick={() => handlePromptClick(prompt)}
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
                                {stableMessages.map(message => (
                                    <Message key={message.id} message={message} />
                                ))}
                            </ConversationContent>
                            <ConversationScrollButton />
                        </Conversation>
                    )}

                    <form onSubmit={handleSubmit} className="border-border/80 bg-background/90 border-t">
                        <div className="p-2">
                            <div className="relative">
                                {attachmentCount > 0 && (
                                    <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2">
                                        {attachments.slice(0, 4).map((attachment, index) => (
                                            <img
                                                key={`${attachment.url}-${index}`}
                                                src={attachment.url}
                                                alt={`attachment-${index + 1}`}
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
                                    onChange={event => setInput(event.target.value)}
                                    placeholder="What to vibe?"
                                    value={input}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-2 pb-2">
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
                                        <span className="ml-1 tabular-nums">{attachmentCount}</span>
                                    ) : null}
                                </Button>

                                <Settings />
                            </div>

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
                </div>
            </Panel>

            <AlertDialog
                open={pendingDeleteConversation !== null}
                onOpenChange={open => {
                    if (!open) {
                        setPendingDeleteConversation(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Do you want to permanently delete “
                            {pendingDeleteConversation?.title || 'this conversation'}”? 
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                void handleDeleteConversationConfirm();
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={confirmDeleteAllOpen}
                onOpenChange={setConfirmDeleteAllOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete all conversations</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove every chat from your device. You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                void (async () => {
                                    await handleDeleteAllConversations();
                                    setConfirmDeleteAllOpen(false);
                                    setIsSettingsOpen(false);
                                })();
                            }}
                        >
                            Delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
});

interface SidebarItemProps {
    conversation: ConversationRecord;
    isActive: boolean;
    onSelect: (conversationId: string) => void;
    onRename: (conversation: ConversationRecord) => void;
    onDelete: (conversation: ConversationRecord) => void;
    onExport: (conversation: ConversationRecord) => void;
}

const ConversationSidebarItem = memo(function ConversationSidebarItem({
    conversation,
    isActive,
    onSelect,
    onRename,
    onDelete,
    onExport,
}: SidebarItemProps) {
    const handleSelect = useCallback(() => {
        onSelect(conversation.id);
    }, [conversation.id, onSelect]);

    const handleDelete = useCallback(() => {
        onDelete(conversation);
    }, [conversation, onDelete]);

    const handleRename = useCallback(() => {
        onRename(conversation);
    }, [conversation, onRename]);

    const handleExport = useCallback(() => {
        onExport(conversation);
    }, [conversation, onExport]);

    const preview = conversation.lastMessagePreview || 'No messages yet';
    const timestampLabel = formatTimestamp(conversation.updatedAt || conversation.createdAt);

    return (
        <div
            className={cn(
                'group flex items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                isActive
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-transparent bg-muted/40 hover:bg-muted/60'
            )}
        >
            <button
                type="button"
                onClick={handleSelect}
                className="flex-1 text-left"
            >
                <div className="flex items-center justify-between">
                    <p
                        className={cn(
                            'text-sm font-semibold',
                            isActive ? 'text-primary' : 'text-foreground'
                        )}
                    >
                        {conversation.title || 'New chat'}
                    </p>
                    <span className="text-muted-foreground text-[10px] font-medium">
                        {timestampLabel}
                    </span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
                    {preview}
                </p>
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <MoreHorizontalIcon className="h-3.5 w-3.5" />
                        <span className="sr-only">Open conversation menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={handleSelect}>Open</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleRename}>
                        <EditIcon className="mr-2 h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleExport}>
                        <DownloadIcon className="mr-2 h-3.5 w-3.5" /> Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleDelete}>
                        <Trash2Icon className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
});

function downloadPayload(payload: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function useStableMessages(messages: ChatUIMessage[]) {
    const previousMessagesRef = useRef<Map<string, ChatUIMessage>>(new Map());

    return useMemo(() => {
        const nextMessages: ChatUIMessage[] = [];
        const nextRef = new Map<string, ChatUIMessage>();

        for (const message of messages) {
            const previousMessage = previousMessagesRef.current.get(message.id);
            if (previousMessage && areMessagesEqual(previousMessage, message)) {
                nextMessages.push(previousMessage);
                nextRef.set(previousMessage.id, previousMessage);
            } else {
                nextMessages.push(message);
                nextRef.set(message.id, message);
            }
        }

        previousMessagesRef.current = nextRef;
        return nextMessages;
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
                    (previousPart.text ?? '') !== (nextReasoning.text ?? '')
                ) {
                    return false;
                }
                break;
            }
            default: {
                if (JSON.stringify(previousPart) !== JSON.stringify(nextPart)) {
                    return false;
                }
            }
        }
    }

    return true;
}

function groupConversations(conversations: ConversationRecord[]) {
    const buckets = new Map<string, ConversationRecord[]>();
    for (const conversation of conversations) {
        const updatedAt = conversation.updatedAt ?? conversation.createdAt;
        const group = getConversationGroupLabel(updatedAt);
        const bucket = buckets.get(group);
        if (bucket) {
            bucket.push(conversation);
        } else {
            buckets.set(group, [conversation]);
        }
    }

    return CONVERSATION_GROUPS.filter(label => buckets.has(label)).map(label => ({
        label,
        conversations: buckets.get(label) ?? [],
    }));
}

const CONVERSATION_GROUPS = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'Earlier',
] as const;

type ConversationGroupLabel = (typeof CONVERSATION_GROUPS)[number];

function getConversationGroupLabel(timestamp: number): ConversationGroupLabel {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfToday = startOfDay(now);
    const date = new Date(timestamp);
    const startOfConversationDay = startOfDay(date);
    const diffDays = Math.floor((startOfToday.getTime() - startOfConversationDay.getTime()) / dayMs);

    if (diffDays <= 0) {
        return 'Today';
    }
    if (diffDays === 1) {
        return 'Yesterday';
    }
    if (diffDays < 7) {
        return 'Last 7 Days';
    }
    if (diffDays < 30) {
        return 'Last 30 Days';
    }
    return 'Earlier';
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTimestamp(timestamp: number) {
    const now = Date.now();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return 'Just now';
    }
    if (diff < hour) {
        const minutes = Math.max(1, Math.round(diff / minute));
        return `${minutes}m ago`;
    }
    if (diff < day) {
        const hours = Math.max(1, Math.round(diff / hour));
        return `${hours}h ago`;
    }
    const days = Math.round(diff / day);
    if (days < 7) {
        return `${days}d ago`;
    }
    return new Date(timestamp).toLocaleDateString();
}
