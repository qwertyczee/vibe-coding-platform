'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Chat, UseChatHelpers } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { ChatUIMessage } from '@/components/chat/types';
import { useSandboxStore } from '@/app/state';
import {
    createConversation,
    deleteConversation as deleteConversationRecord,
    exportAllConversations,
    exportConversation as exportConversationPayload,
    getConversation,
    getConversationMessages,
    importConversations,
    listConversations,
    releaseAttachmentUrls,
    renameConversation as renameConversationRecord,
    saveConversationSnapshot,
    type ConversationExportPayload,
    type ConversationRecord,
    type ReasoningEffort,
} from './chat-storage';

interface UsePersistentChatSessionOptions {
    chat: Chat<ChatUIMessage>;
    modelId?: string;
    reasoningEffort?: ReasoningEffort;
}

type ChatHelperSubset = Pick<
    UseChatHelpers<ChatUIMessage>,
    | 'messages'
    | 'status'
    | 'sendMessage'
    | 'setMessages'
    | 'regenerate'
    | 'stop'
    | 'error'
    | 'clearError'
    | 'resumeStream'
    | 'addToolResult'
>;

export interface PersistentChatControls extends ChatHelperSubset {
    activeConversation?: ConversationRecord;
    conversations: ConversationRecord[];
    selectConversation: (conversationId: string) => Promise<void>;
    startNewConversation: () => Promise<void>;
    renameConversation: (conversationId: string, title: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    exportConversation: (conversationId: string) => Promise<ConversationExportPayload | null>;
    exportAll: () => Promise<ConversationExportPayload[]>;
    importFromPayloads: (payloads: ConversationExportPayload[]) => Promise<void>;
    isHydrating: boolean;
}

const PERSIST_DEBOUNCE_MS = 350;

function inferConversationTitle(messages: ChatUIMessage[]) {
    for (const message of messages) {
        if (message.role !== 'user') {
            continue;
        }
        for (const part of message.parts) {
            if (part.type === 'text' && part.text.trim().length > 0) {
                return part.text.trim().slice(0, 60);
            }
        }
    }
    return 'New chat';
}

export function usePersistentChatSession({
    chat,
    modelId,
    reasoningEffort,
}: UsePersistentChatSessionOptions): PersistentChatControls {
    const {
        messages,
        status,
        sendMessage,
        setMessages,
        regenerate,
        stop,
        error,
        clearError,
        resumeStream,
        addToolResult,
    } = useChat<ChatUIMessage>({ chat });

    const {
        sandboxId,
        paths,
        commands,
        setSandboxId,
        addPaths,
        upsertCommand,
    } = useSandboxStore();

    const [conversations, setConversations] = useState<ConversationRecord[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isHydrating, setIsHydrating] = useState(true);
    const persistTimeoutRef = useRef<number | null>(null);
    const hydratingRef = useRef(false);

    const loadConversations = useCallback(async () => {
        const all = await listConversations();
        if (all.length === 0) {
            const created = await createConversation();
            setConversations([created]);
            setActiveConversationId(created.id);
            return;
        }
        setConversations(all);
        setActiveConversationId(prev => prev ?? all[0]!.id);
    }, []);

    useEffect(() => {
        loadConversations().catch(console.error);
    }, [loadConversations]);

    const hydrateConversation = useCallback(
        async (conversationId: string) => {
            hydratingRef.current = true;
            setIsHydrating(true);
            releaseAttachmentUrls();

            const conversation = await getConversation(conversationId);
            const { messages: persistedMessages } = await getConversationMessages(
                conversationId
            );

            // Restore Workspace State
            if (conversation?.sandboxId) {
                setSandboxId(conversation.sandboxId);
                // setSandboxId resets paths and commands, so we restore them after
                if (conversation.filePaths?.length) {
                    addPaths(conversation.filePaths);
                }
                if (conversation.commandLogs?.length) {
                    conversation.commandLogs.forEach((cmd: any) => {
                        upsertCommand(cmd);
                    });
                }
            } else {
                // Clear sandbox if this chat doesn't have one
                setSandboxId(undefined);
            }

            setMessages(persistedMessages);
            setIsHydrating(false);
            hydratingRef.current = false;
        },
        [setMessages, setSandboxId, addPaths, upsertCommand]
    );

    useEffect(() => {
        if (!activeConversationId) {
            return;
        }
        hydrateConversation(activeConversationId).catch(error => {
            console.error('Failed to hydrate conversation', error);
            hydratingRef.current = false;
            setIsHydrating(false);
        });
    }, [activeConversationId, hydrateConversation]);

    useEffect(() => {
        return () => {
            if (persistTimeoutRef.current) {
                window.clearTimeout(persistTimeoutRef.current);
            }
            releaseAttachmentUrls();
        };
    }, []);

    useEffect(() => {
        if (
            !activeConversationId ||
            hydratingRef.current ||
            isHydrating ||
            status === 'streaming'
        ) {
            return;
        }

        if (persistTimeoutRef.current) {
            window.clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = window.setTimeout(async () => {
            persistTimeoutRef.current = null;
            const record = await saveConversationSnapshot(
                activeConversationId,
                messages,
                {
                    modelId,
                    reasoningEffort,
                },
                {
                    sandboxId,
                    filePaths: paths,
                    commandLogs: commands,
                }
            );
            if (record) {
                setConversations(current =>
                    current.map(item => (item.id === record.id ? record : item))
                );
            }
        }, PERSIST_DEBOUNCE_MS);
    }, [
        activeConversationId,
        messages,
        modelId,
        reasoningEffort,
        isHydrating,
        status,
        sandboxId,
        paths,
        commands,
    ]);

    const selectConversation = useCallback(async (conversationId: string) => {
        const conversation = await getConversation(conversationId);
        if (!conversation) {
            return;
        }
        
        setActiveConversationId(conversationId);
        setConversations(current =>
            current.map(item => (item.id === conversationId ? conversation : item))
        );
    }, []);

    const startNewConversation = useCallback(async () => {
        if (activeConversationId) {
            await saveConversationSnapshot(
                activeConversationId, 
                messages, 
                {
                    modelId,
                    reasoningEffort,
                },
                {
                    sandboxId,
                    filePaths: paths,
                    commandLogs: commands,
                }
            );
        }

        const newConversation = await createConversation(inferConversationTitle([]), {
            modelId,
            reasoningEffort,
        });

        // Reset workspace for new conversation
        setSandboxId(undefined);

        setConversations(current => [newConversation, ...current]);
        setActiveConversationId(newConversation.id);
        setMessages([]);
    }, [activeConversationId, messages, modelId, reasoningEffort, setMessages, sandboxId, paths, commands, setSandboxId]);

    const renameConversation = useCallback(async (conversationId: string, title: string) => {
        await renameConversationRecord(conversationId, title.trim());
        const updated = await getConversation(conversationId);
        if (updated) {
            setConversations(current =>
                current.map(item => (item.id === conversationId ? updated : item))
            );
        }
    }, []);

    const deleteConversation = useCallback(async (conversationId: string) => {
        await deleteConversationRecord(conversationId);
        releaseAttachmentUrls();
        setConversations(current => current.filter(item => item.id !== conversationId));
        if (activeConversationId === conversationId) {
            const remaining = await listConversations();
            if (remaining.length > 0) {
                setActiveConversationId(remaining[0]!.id);
            } else {
                const created = await createConversation();
                setConversations([created]);
                setActiveConversationId(created.id);
                setMessages([]);
                setSandboxId(undefined);
            }
        }
    }, [activeConversationId, setMessages, setSandboxId]);

    const exportConversation = useCallback(
        async (conversationId: string) => exportConversationPayload(conversationId),
        []
    );

    const exportAll = useCallback(async () => exportAllConversations(), []);

    const importFromPayloads = useCallback(async (payloads: ConversationExportPayload[]) => {
        await importConversations(payloads);
        const updated = await listConversations();
        setConversations(updated);
        if (!activeConversationId && updated.length > 0) {
            setActiveConversationId(updated[0]!.id);
        }
    }, [activeConversationId]);

    const activeConversation = useMemo(
        () => conversations.find(item => item.id === activeConversationId),
        [conversations, activeConversationId]
    );

    return {
        messages,
        status,
        sendMessage,
        setMessages,
        regenerate,
        stop,
        error,
        clearError,
        resumeStream,
        addToolResult,
        activeConversation,
        conversations,
        selectConversation,
        startNewConversation,
        renameConversation,
        deleteConversation,
        exportConversation,
        exportAll,
        importFromPayloads,
        isHydrating,
    };
}