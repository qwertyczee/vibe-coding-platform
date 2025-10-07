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

export const Settings = memo(function Settings() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="cursor-pointer" variant="outline" size="sm">
                    <SlidersVerticalIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0">
                <div className="space-y-6 p-4">
                    <div>
                        <h3 className="mb-2 text-sm font-medium">
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
