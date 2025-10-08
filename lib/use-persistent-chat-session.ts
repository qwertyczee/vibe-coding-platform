'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Chat, UseChatHelpers } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { ChatUIMessage } from '@/components/chat/types';
import {
    createConversation,
    deleteAllConversations as deleteAllConversationsFromDb,
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
    conversationId?: string;
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
    conversations: ConversationRecord[];
    currentConversation?: ConversationRecord;
    isHydrating: boolean;
    hasHydratedOnce: boolean;
    refreshConversations: () => Promise<void>;
    createConversation: (title?: string) => Promise<ConversationRecord>;
    renameConversation: (conversationId: string, title: string) => Promise<void>;
    deleteConversation: (conversationId: string) => Promise<void>;
    deleteAllConversations: () => Promise<void>;
    exportConversation: (
        conversationId: string
    ) => Promise<ConversationExportPayload | null>;
    exportAll: () => Promise<ConversationExportPayload[]>;
    importFromPayloads: (payloads: ConversationExportPayload[]) => Promise<void>;
}

const PERSIST_DEBOUNCE_MS = 350;

export function usePersistentChatSession({
    chat,
    conversationId,
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

    const [conversations, setConversations] = useState<ConversationRecord[]>([]);
    const [isHydrating, setIsHydrating] = useState(true);
    const [hasHydratedOnce, setHasHydratedOnce] = useState(false);
    const persistTimeoutRef = useRef<number | null>(null);
    const hydratingRef = useRef(false);
    const lastHydratedConversationIdRef = useRef<string | undefined>(undefined);

    const refreshConversations = useCallback(async () => {
        const records = await listConversations();
        setConversations(records);
    }, []);

    useEffect(() => {
        refreshConversations().catch(console.error);
    }, [refreshConversations]);

    useEffect(() => {
        return () => {
            if (persistTimeoutRef.current) {
                window.clearTimeout(persistTimeoutRef.current);
            }
            releaseAttachmentUrls();
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function hydrate() {
            if (!conversationId) {
                hydratingRef.current = false;
                setIsHydrating(false);
                setHasHydratedOnce(true);
                lastHydratedConversationIdRef.current = undefined;
                setMessages([]);
                releaseAttachmentUrls();
                return;
            }

            hydratingRef.current = true;
            setIsHydrating(true);
            releaseAttachmentUrls();
            const conversation = await getConversation(conversationId);
            if (!conversation) {
                if (!cancelled) {
                    setMessages([]);
                    setIsHydrating(false);
                    setHasHydratedOnce(true);
                    hydratingRef.current = false;
                    lastHydratedConversationIdRef.current = undefined;
                }
                return;
            }

            const { messages: persistedMessages } = await getConversationMessages(
                conversationId
            );
            if (cancelled) {
                return;
            }
            setMessages(persistedMessages);
            setIsHydrating(false);
            hydratingRef.current = false;
            lastHydratedConversationIdRef.current = conversationId;
            setHasHydratedOnce(true);
        }

        hydrate().catch(error => {
            console.error('Failed to hydrate conversation', error);
            hydratingRef.current = false;
            setIsHydrating(false);
            lastHydratedConversationIdRef.current = undefined;
        });

        return () => {
            cancelled = true;
        };
    }, [conversationId, setMessages]);

    useEffect(() => {
        if (
            !conversationId ||
            hydratingRef.current ||
            isHydrating ||
            lastHydratedConversationIdRef.current !== conversationId
        ) {
            return;
        }

        if (persistTimeoutRef.current) {
            window.clearTimeout(persistTimeoutRef.current);
        }

        persistTimeoutRef.current = window.setTimeout(async () => {
            persistTimeoutRef.current = null;
            const record = await saveConversationSnapshot(conversationId, messages, {
                modelId,
                reasoningEffort,
            });
            if (!record) {
                return;
            }
            setConversations(prev => {
                const next = prev.filter(item => item.id !== record.id);
                return [record, ...next];
            });
        }, PERSIST_DEBOUNCE_MS);
    }, [conversationId, isHydrating, messages, modelId, reasoningEffort]);

    const createConversationHandler = useCallback(async (title?: string) => {
        const record = await createConversation(title, { modelId, reasoningEffort });
        setConversations(prev => [record, ...prev]);
        return record;
    }, [modelId, reasoningEffort]);

    const renameConversation = useCallback(async (conversationId: string, title: string) => {
        await renameConversationRecord(conversationId, title.trim());
        const updated = await getConversation(conversationId);
        if (updated) {
            setConversations(prev => {
                const filtered = prev.filter(item => item.id !== conversationId);
                return [updated, ...filtered];
            });
        }
    }, []);

    const deleteConversation = useCallback(async (conversationId: string) => {
        await deleteConversationRecord(conversationId);
        releaseAttachmentUrls();
        setConversations(prev => prev.filter(item => item.id !== conversationId));
    }, []);

    const deleteAllConversationsHandler = useCallback(async () => {
        await deleteAllConversationsFromDb();
        releaseAttachmentUrls();
        setConversations([]);
        setMessages([]);
        setHasHydratedOnce(true);
        lastHydratedConversationIdRef.current = undefined;
    }, [setMessages]);

    const exportConversation = useCallback(
        async (conversationId: string) => exportConversationPayload(conversationId),
        []
    );

    const exportAll = useCallback(async () => exportAllConversations(), []);

    const importFromPayloads = useCallback(async (payloads: ConversationExportPayload[]) => {
        await importConversations(payloads);
        await refreshConversations();
    }, [refreshConversations]);

    const currentConversation = useMemo(
        () => conversations.find(item => item.id === conversationId),
        [conversations, conversationId]
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
        conversations,
        currentConversation,
        isHydrating,
        hasHydratedOnce,
        refreshConversations,
        createConversation: createConversationHandler,
        renameConversation,
        deleteConversation,
        deleteAllConversations: deleteAllConversationsHandler,
        exportConversation,
        exportAll,
        importFromPayloads,
    };
}
