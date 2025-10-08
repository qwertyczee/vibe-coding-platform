import { AutoFixErrors } from './auto-fix-errors';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ReasoningEffort } from './reasoning-effort';
import { ModelSelector } from './model-selector';
import { SlidersVerticalIcon } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
}

export const Settings = memo(function Settings({ className }: Props) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    className={cn(
                        'h-9 rounded-full border border-white/10 bg-white/10 text-xs text-white/80 shadow-[0_12px_40px_-30px_rgba(75,139,255,0.5)] transition hover:border-white/30 hover:bg-white/20',
                        className
                    )}
                    variant="ghost"
                    size="sm"
                >
                    <SlidersVerticalIcon className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Tuning</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 rounded-3xl border border-white/10 bg-surface-200/90 p-0 text-foreground shadow-[0_40px_120px_-50px_rgba(8,15,30,0.95)] backdrop-blur-2xl">
                <div className="space-y-6 p-5">
                    <div>
                        <h3 className="mb-2 text-sm font-medium text-white/80">
                            Model Selection
                        </h3>
                        <ModelSelector />
                    </div>
                    <AutoFixErrors />
                    <ReasoningEffort />
                </div>
            </PopoverContent>
        </Popover>
    );
});
