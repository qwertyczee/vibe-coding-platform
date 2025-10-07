import type { DataPart } from '@/ai/messages/data-parts';
import { BoxIcon, CheckIcon, XIcon } from 'lucide-react';
import { Spinner } from './spinner';
import { ToolHeader } from '../tool-header';
import { ToolMessage } from '../tool-message';
import { memo, useMemo } from 'react';

interface Props {
    message: DataPart['create-sandbox'];
}

export const CreateSandbox = memo(function CreateSandbox({ message }: Props) {
    const statusText = useMemo(() => {
        switch (message.status) {
            case 'done':
                return 'Sandbox created successfully';
            case 'loading':
                return 'Creating Sandbox';
            case 'error':
                return 'Failed to create sandbox';
            default:
                return '';
        }
    }, [message.status]);

    const isLoading = message.status === 'loading';
    const isError = message.status === 'error';

    return (
        <ToolMessage>
            <ToolHeader>
                <BoxIcon className="h-3.5 w-3.5" />
                Create Sandbox
            </ToolHeader>
            <div className="relative min-h-5 pl-6">
                <Spinner
                    className="absolute top-0 left-0"
                    loading={isLoading}
                >
                    {isError ? (
                        <XIcon className="h-4 w-4 text-red-700" />
                    ) : (
                        <CheckIcon className="h-4 w-4" />
                    )}
                </Spinner>
                <span>{statusText}</span>
            </div>
        </ToolMessage>
    );
});
