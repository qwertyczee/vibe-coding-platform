import type { DataPart } from '@/ai/messages/data-parts';
import { CheckIcon, LinkIcon } from 'lucide-react';
import { Spinner } from './spinner';
import { ToolHeader } from '../tool-header';
import { ToolMessage } from '../tool-message';

export function GetSandboxURL({
    message,
}: {
    message: DataPart['get-sandbox-url'];
}) {
    return (
        <ToolMessage>
            <ToolHeader>
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Get Sandbox URL</span>
            </ToolHeader>
            <div className="relative min-h-5 pl-6">
                <Spinner
                    className="absolute top-0 left-0"
                    loading={message.status === 'loading'}
                >
                    <CheckIcon className="h-4 w-4" />
                </Spinner>
                {message.url ? (
                    <a href={message.url} target="_blank">
                        {message.url}
                    </a>
                ) : (
                    <span>Getting Sandbox URL</span>
                )}
            </div>
        </ToolMessage>
    );
}
