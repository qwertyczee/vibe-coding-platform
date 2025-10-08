'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation, listConversations } from '@/lib/chat-storage';

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        async function ensureConversation() {
            const conversations = await listConversations();
            if (cancelled) {
                return;
            }
            if (conversations.length > 0) {
                router.replace(`/${conversations[0]!.id}`);
                return;
            }
            const created = await createConversation();
            if (!cancelled) {
                router.replace(`/${created.id}`);
            }
        }

        ensureConversation().catch(error => {
            console.error('Failed to load conversations', error);
        });

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="animate-pulse">Preparing your chats…</span>
        </div>
    );
}
