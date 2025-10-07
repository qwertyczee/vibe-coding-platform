import type { DataPart } from '@/ai/messages/data-parts';
import { BoxIcon, CheckIcon, XIcon } from 'lucide-react';
import { Spinner } from './spinner';
import { ToolHeader } from '../tool-header';
import { ToolMessage } from '../tool-message';

interface Props {
    message: DataPart['create-sandbox'];
}

export function CreateSandbox({ message }: Props) {
    return (
        <ToolMessage>
            <ToolHeader>
                <BoxIcon className="h-3.5 w-3.5" />
                Create Sandbox
            </ToolHeader>
            <div className="relative min-h-5 pl-6">
                <Spinner
                    className="absolute top-0 left-0"
                    loading={message.status === 'loading'}
                >
                    {message.status === 'error' ? (
                        <XIcon className="h-4 w-4 text-red-700" />
                    ) : (
                        <CheckIcon className="h-4 w-4" />
                    )}
                </Spinner>
                <span>
                    {message.status === 'done' &&
                        'Sandbox created successfully'}
                    {message.status === 'loading' && 'Creating Sandbox'}
                    {message.status === 'error' && 'Failed to create sandbox'}
                </span>
            </div>
        </ToolMessage>
    );
}
