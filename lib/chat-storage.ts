'use client';

import Dexie, { type Table } from 'dexie';
import type { ChatUIMessage } from '@/components/chat/types';

export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface ConversationRecord {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    modelId?: string;
    reasoningEffort?: ReasoningEffort;
    lastMessagePreview?: string;
    isRenamed?: boolean;
}

export type PersistedMessagePart = ChatUIMessage['parts'][number] & {
    persistedAttachmentId?: string;
};

export interface MessageRecord {
    id: string;
    conversationId: string;
    createdAt: number;
    role: ChatUIMessage['role'];
    message: Omit<ChatUIMessage, 'parts'> & {
        parts: PersistedMessagePart[];
    };
}

export interface AttachmentRecord {
    id: string;
    conversationId: string;
    messageId: string;
    partIndex: number;
    mediaType: string;
    filename?: string;
    blob: Blob;
    createdAt: number;
}

export interface ConversationExportPayload {
    conversation: ConversationRecord;
    messages: MessageRecord[];
    attachments: Array<Omit<AttachmentRecord, 'blob'> & { blob: string }>;
}

class ChatDatabase extends Dexie {
    public conversations!: Table<ConversationRecord, string>;
    public messages!: Table<MessageRecord, string>;
    public attachments!: Table<AttachmentRecord, string>;

    constructor() {
        super('vibe-chat-db');
        this.version(1).stores({
            conversations: '&id, updatedAt',
            messages: '&id, conversationId, createdAt',
            attachments: '&id, conversationId, messageId',
        });
    }
}

export const chatDatabase = new ChatDatabase();

const attachmentUrlCache = new Map<string, string>();

function structuredCloneMessage(message: ChatUIMessage): MessageRecord['message'] {
    const clone = structuredClone(message);
    return clone;
}

export function releaseAttachmentUrls(ids?: string[]) {
    if (!ids) {
        for (const url of attachmentUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
        attachmentUrlCache.clear();
        return;
    }

    for (const id of ids) {
        const url = attachmentUrlCache.get(id);
        if (url) {
            URL.revokeObjectURL(url);
            attachmentUrlCache.delete(id);
        }
    }
}

function createAttachmentUrl(record: AttachmentRecord) {
    const cached = attachmentUrlCache.get(record.id);
    if (cached) {
        return cached;
    }
    const url = URL.createObjectURL(record.blob);
    attachmentUrlCache.set(record.id, url);
    return url;
}

export async function listConversations(): Promise<ConversationRecord[]> {
    const items = await chatDatabase.conversations.orderBy('updatedAt').reverse().toArray();
    return items;
}

export async function getConversation(id: string): Promise<ConversationRecord | undefined> {
    return chatDatabase.conversations.get(id);
}

function getPreviewFromMessage(message: ChatUIMessage) {
    for (const part of message.parts) {
        if (part.type === 'text' && part.text.trim().length > 0) {
            return part.text.trim().slice(0, 120);
        }
    }
    return undefined;
}

export async function createConversation(
    title = 'New chat',
    options: Partial<Pick<ConversationRecord, 'modelId' | 'reasoningEffort'>> = {}
): Promise<ConversationRecord> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const record: ConversationRecord = {
        id,
        title,
        createdAt: timestamp,
        updatedAt: timestamp,
        isRenamed: false,
        ...options,
    };
    await chatDatabase.conversations.put(record);
    return record;
}

export async function deleteConversation(conversationId: string) {
    await chatDatabase.transaction('rw', chatDatabase.messages, chatDatabase.attachments, chatDatabase.conversations, async () => {
        await chatDatabase.messages
            .where('conversationId')
            .equals(conversationId)
            .delete();
        await chatDatabase.attachments
            .where('conversationId')
            .equals(conversationId)
            .delete();
        await chatDatabase.conversations.delete(conversationId);
    });
}

export async function renameConversation(conversationId: string, title: string) {
    await chatDatabase.conversations.update(conversationId, {
        title,
        isRenamed: true,
        updatedAt: Date.now(),
    });
}

interface SerializationResult {
    record: MessageRecord;
    attachmentIds: string[];
}

async function serializeMessage(
    conversationId: string,
    message: ChatUIMessage,
    partBlobs: Array<Promise<AttachmentRecord | null>>
): Promise<SerializationResult> {
    const cloned = structuredCloneMessage(message);
    const attachmentIds: string[] = [];

    const parts = cloned.parts.map((part, index) => {
        if (part.type !== 'file') {
            return part;
        }

        const existingId = (part as PersistedMessagePart).persistedAttachmentId;
        const attachmentId = existingId ?? crypto.randomUUID();
        attachmentIds.push(attachmentId);

        const storedPart: PersistedMessagePart = {
            ...part,
            url: `attachment://${attachmentId}`,
            persistedAttachmentId: attachmentId,
        };

        if (!existingId) {
            const blobPromise = fetch(part.url)
                .then(response => response.blob())
                .then(blob => ({
                    id: attachmentId,
                    conversationId,
                    messageId: message.id,
                    partIndex: index,
                    mediaType: part.mediaType,
                    filename: part.filename,
                    blob,
                    createdAt: Date.now(),
                }))
                .catch(error => {
                    console.error('Failed to persist attachment', error);
                    return null;
                });
            partBlobs.push(blobPromise);
        }

        return storedPart;
    });

    const timestampCandidate = (
        message as Partial<{ createdAt: number | string }>
    ).createdAt;
    const createdAt =
        typeof timestampCandidate === 'number'
            ? timestampCandidate
            : typeof timestampCandidate === 'string'
            ? Number.isNaN(Date.parse(timestampCandidate))
                ? Date.now()
                : Date.parse(timestampCandidate)
            : Date.now();

    const record: MessageRecord = {
        id: message.id,
        conversationId,
        createdAt,
        role: message.role,
        message: {
            ...cloned,
            parts,
        },
    };

    return {
        record,
        attachmentIds,
    };
}

export async function saveConversationSnapshot(
    conversationId: string,
    messages: ChatUIMessage[],
    metadata: Partial<Pick<ConversationRecord, 'modelId' | 'reasoningEffort'>> = {}
): Promise<ConversationRecord | undefined> {
    const blobPromises: Array<Promise<AttachmentRecord | null>> = [];
    const serializationResults = await Promise.all(
        messages.map(message => serializeMessage(conversationId, message, blobPromises))
    );

    const newMessageRecords = serializationResults.map(result => result.record);
    const attachmentIdsInUse = new Set<string>();
    serializationResults.forEach(result => {
        for (const id of result.attachmentIds) {
            attachmentIdsInUse.add(id);
        }
    });

    const newAttachments = (await Promise.all(blobPromises)).filter(
        (record): record is AttachmentRecord => record !== null
    );

    await chatDatabase.transaction(
        'rw',
        chatDatabase.messages,
        chatDatabase.attachments,
        chatDatabase.conversations,
        async () => {
            const existingMessageIds = await chatDatabase.messages
                .where('conversationId')
                .equals(conversationId)
                .primaryKeys();
            const incomingIds = new Set(newMessageRecords.map(message => message.id));
            const messagesToDelete = existingMessageIds.filter(id => !incomingIds.has(id));
            if (messagesToDelete.length > 0) {
                await chatDatabase.messages.bulkDelete(messagesToDelete);
            }

            if (newMessageRecords.length > 0) {
                await chatDatabase.messages.bulkPut(newMessageRecords);
            }

            const existingAttachmentIds = await chatDatabase.attachments
                .where('conversationId')
                .equals(conversationId)
                .primaryKeys();
            const attachmentsToDelete = existingAttachmentIds.filter(
                id => !attachmentIdsInUse.has(id)
            );
            if (attachmentsToDelete.length > 0) {
                await chatDatabase.attachments.bulkDelete(attachmentsToDelete);
            }

            if (newAttachments.length > 0) {
                await chatDatabase.attachments.bulkPut(newAttachments);
            }

            const conversation = await chatDatabase.conversations.get(conversationId);
            if (!conversation) {
                return;
            }

            const lastMessage = messages[messages.length - 1];
            const preview = lastMessage ? getPreviewFromMessage(lastMessage) : undefined;
            const shouldUpdateTitle = !conversation.isRenamed;
            let updatedTitle = conversation.title;

            if (shouldUpdateTitle) {
                const firstUserMessage = messages.find(msg => msg.role === 'user');
                const candidate = firstUserMessage
                    ? getPreviewFromMessage(firstUserMessage)
                    : undefined;
                if (candidate && candidate !== conversation.title) {
                    updatedTitle = candidate;
                }
            }

            await chatDatabase.conversations.update(conversationId, {
                updatedAt: Date.now(),
                lastMessagePreview: preview,
                ...(shouldUpdateTitle ? { title: updatedTitle } : {}),
                ...metadata,
            });
        }
    );

    return chatDatabase.conversations.get(conversationId);
}

export async function getConversationMessages(
    conversationId: string
): Promise<{ messages: ChatUIMessage[]; attachmentIds: string[] }> {
    const [messageRecords, attachments] = await Promise.all([
        chatDatabase.messages
            .where('conversationId')
            .equals(conversationId)
            .sortBy('createdAt'),
        chatDatabase.attachments
            .where('conversationId')
            .equals(conversationId)
            .toArray(),
    ]);

    const attachmentMap = new Map<string, AttachmentRecord>();
    for (const attachment of attachments) {
        attachmentMap.set(attachment.id, attachment);
    }

    const usedAttachmentIds: string[] = [];

    const messages = messageRecords.map(record => {
        const cloned = structuredClone(record.message) as ChatUIMessage;
        cloned.parts = cloned.parts.map(part => {
            if (part.type !== 'file') {
                return part;
            }

            const persistedId = (part as PersistedMessagePart).persistedAttachmentId ??
                (part.url?.startsWith('attachment://')
                    ? part.url.slice('attachment://'.length)
                    : undefined);

            if (!persistedId) {
                return part;
            }

            const attachment = attachmentMap.get(persistedId);
            if (!attachment) {
                return part;
            }

            const url = createAttachmentUrl(attachment);
            usedAttachmentIds.push(persistedId);
            return {
                ...part,
                url,
                persistedAttachmentId: persistedId,
            } satisfies PersistedMessagePart;
        });

        return cloned;
    });

    return { messages, attachmentIds: usedAttachmentIds };
}

export async function exportConversation(
    conversationId: string
): Promise<ConversationExportPayload | null> {
    const conversation = await chatDatabase.conversations.get(conversationId);
    if (!conversation) {
        return null;
    }

    const messages = await chatDatabase.messages
        .where('conversationId')
        .equals(conversationId)
        .toArray();
    const attachments = await chatDatabase.attachments
        .where('conversationId')
        .equals(conversationId)
        .toArray();

    const attachmentsPayload = await Promise.all(
        attachments.map(async attachment => ({
            ...attachment,
            blob: await blobToBase64(attachment.blob),
        }))
    );

    return {
        conversation,
        messages,
        attachments: attachmentsPayload,
    };
}

export async function exportAllConversations(): Promise<ConversationExportPayload[]> {
    const conversations = await chatDatabase.conversations.toArray();
    const exports: ConversationExportPayload[] = [];
    for (const conversation of conversations) {
        const payload = await exportConversation(conversation.id);
        if (payload) {
            exports.push(payload);
        }
    }
    return exports;
}

function base64ToBlob(base64: string, type: string) {
    const byteString = atob(base64.split(',')[1] ?? base64);
    const byteNumbers = new Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
        byteNumbers[i] = byteString.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
}

function blobToBase64(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function importConversations(payloads: ConversationExportPayload[]) {
    for (const payload of payloads) {
        const newConversationId = crypto.randomUUID();
        const conversationRecord: ConversationRecord = {
            ...payload.conversation,
            id: newConversationId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const messageIdMap = new Map<string, string>();
        const attachmentIdMap = new Map<string, string>();

        const messageRecords: MessageRecord[] = payload.messages.map(message => {
            const newMessageId = crypto.randomUUID();
            messageIdMap.set(message.id, newMessageId);
            const messageClone = structuredClone(message.message) as ChatUIMessage;
            messageClone.id = newMessageId;
            const parts = messageClone.parts.map(part => {
                if (part.type !== 'file') {
                    return part;
                }
                const persistedId = (part as PersistedMessagePart).persistedAttachmentId ??
                    (typeof part.url === 'string' && part.url.startsWith('attachment://')
                        ? part.url.slice('attachment://'.length)
                        : undefined);
                const newAttachmentId = crypto.randomUUID();
                if (persistedId) {
                    attachmentIdMap.set(persistedId, newAttachmentId);
                }
                return {
                    ...part,
                    url: `attachment://${newAttachmentId}`,
                    persistedAttachmentId: newAttachmentId,
                } satisfies PersistedMessagePart;
            });
            return {
                id: newMessageId,
                conversationId: newConversationId,
                createdAt: message.createdAt,
                role: message.role,
                message: {
                    ...messageClone,
                    parts,
                },
            } satisfies MessageRecord;
        });

        const attachmentRecords: AttachmentRecord[] = payload.attachments.map(attachment => {
            const blob = base64ToBlob(attachment.blob, attachment.mediaType);
            const mappedId =
                attachmentIdMap.get(attachment.id) ?? crypto.randomUUID();
            const mappedMessageId = messageIdMap.get(attachment.messageId) ?? crypto.randomUUID();
            return {
                id: mappedId,
                conversationId: newConversationId,
                messageId: mappedMessageId,
                partIndex: attachment.partIndex,
                mediaType: attachment.mediaType,
                filename: attachment.filename,
                blob,
                createdAt: Date.now(),
            } satisfies AttachmentRecord;
        });

        await chatDatabase.transaction(
            'rw',
            chatDatabase.conversations,
            chatDatabase.messages,
            chatDatabase.attachments,
            async () => {
                await chatDatabase.conversations.put(conversationRecord);
                if (messageRecords.length > 0) {
                    await chatDatabase.messages.bulkPut(messageRecords);
                }
                if (attachmentRecords.length > 0) {
                    await chatDatabase.attachments.bulkPut(attachmentRecords);
                }
            }
        );
    }
}