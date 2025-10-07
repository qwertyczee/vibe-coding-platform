import { useFixErrors } from '@/components/settings/use-settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function AutoFixErrors() {
    const [fixErrors, setFixErrors] = useFixErrors();
    return (
        <div
            className="hover:bg-accent/50 -m-2 flex cursor-pointer items-center justify-between rounded p-2"
            onClick={() => setFixErrors(!fixErrors)}
        >
            <div className="pointer-events-none flex-1 space-y-1">
                <Label className="text-foreground text-sm" htmlFor="auto-fix">
                    Auto-fix errors
                </Label>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Automatically detects and fixes errors in generated code.
                </p>
            </div>
            <Checkbox
                id="auto-fix"
                className="pointer-events-none ml-3"
                checked={fixErrors}
                onCheckedChange={checked =>
                    setFixErrors(checked === 'indeterminate' ? false : checked)
                }
            />
        </div>
    );
}
