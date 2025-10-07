import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface Props {
    className?: string;
    children: ReactNode;
}

export const Panel = memo(function Panel({ className, children }: Props) {
    return (
        <div
            className={cn(
                'border-primary/18 relative flex h-full w-full flex-col rounded-sm border shadow-sm',
                className
            )}
        >
            {children}
        </div>
    );
});

export const PanelHeader = memo(function PanelHeader({
    className,
    children,
}: Props) {
    return (
        <div
            className={cn(
                'border-primary/18 text-secondary-foreground bg-secondary flex items-center border-b px-2.5 py-1.5 text-sm',
                className
            )}
        >
            {children}
        </div>
    );
});
