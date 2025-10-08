'use client';

import { Preview as PreviewComponent } from '@/components/preview/preview';
import { useSandboxStore } from './state';
import type { PanelTone } from '@/components/panels/panels';

interface Props {
    className?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export function Preview({ className, tone = 'surface', glow }: Props) {
    const { status, url, urlUUID } = useSandboxStore();
    return (
        <PreviewComponent
            key={urlUUID}
            className={className}
            disabled={status === 'stopped'}
            url={url}
            tone={tone}
            glow={glow}
        />
    );
}
