import { VercelDashed } from '@/components/icons/vercel-dashed';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
}

export function Header({ className }: Props) {
    return (
        <header className={cn('flex items-center justify-between', className)}>
            <div className="flex items-center">
                <VercelDashed className="mr-1.5 ml-1 md:ml-2.5" />
                <span className="hidden font-mono text-sm font-bold tracking-tight uppercase md:inline">
                    OSS Vibe Coding Platform
                </span>
            </div>
        </header>
    );
}
