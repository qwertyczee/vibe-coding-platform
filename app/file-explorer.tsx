'use client';

import { FileExplorer as FileExplorerComponent } from '@/components/file-explorer/file-explorer';
import { useSandboxStore } from './state';
import type { PanelTone } from '@/components/panels/panels';

interface Props {
    className?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export function FileExplorer({ className, tone = 'surface', glow }: Props) {
    const { sandboxId, status, paths } = useSandboxStore();
    return (
        <FileExplorerComponent
            className={className}
            disabled={status === 'stopped'}
            sandboxId={sandboxId}
            paths={paths}
            tone={tone}
            glow={glow}
        />
    );
}
