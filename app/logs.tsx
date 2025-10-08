'use client';

import { CommandsLogs } from '@/components/commands-logs/commands-logs';
import { memo } from 'react';
import type { PanelTone } from '@/components/panels/panels';

interface Props {
    className?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export const Logs = memo(function Logs({ className, tone = 'sunken', glow }: Props) {
    return <CommandsLogs className={className} tone={tone} glow={glow} />;
});
