'use client';

import { WorkspaceShell } from '../workspace-shell';

interface ChatPageProps {
    params: {
        chatId: string;
    };
}

export default function ChatPage({ params }: ChatPageProps) {
    return <WorkspaceShell chatId={params.chatId} />;
}
