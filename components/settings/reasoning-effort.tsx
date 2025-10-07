import { Models } from '@/ai/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useModelId, useReasoningEffort } from './use-settings';

export function ReasoningEffort() {
    const [modelId] = useModelId();
    const [effort, setEffort] = useReasoningEffort();
    if (modelId !== Models.OpenAIGPT5) {
        return null;
    }

    return (
        <div
            className="hover:bg-accent/50 -m-2 flex cursor-pointer items-center justify-between rounded p-2"
            onClick={() => setEffort(effort === 'medium' ? 'low' : 'medium')}
        >
            <div className="pointer-events-none flex-1 space-y-1">
                <Label
                    className="text-foreground text-sm"
                    htmlFor="effort-level"
                >
                    Higher Effort Level
                </Label>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    With GPT-5, you can request higher reasoning effort level.
                </p>
            </div>
            <Checkbox
                id="effort-level"
                className="pointer-events-none ml-3"
                checked={effort === 'medium'}
                onCheckedChange={checked =>
                    setEffort(checked === true ? 'medium' : 'low')
                }
            />
        </div>
    );
}
