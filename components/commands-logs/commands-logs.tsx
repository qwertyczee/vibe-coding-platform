'use client';

import { Panel, PanelHeader, type PanelTone } from '@/components/panels/panels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WavesIcon } from 'lucide-react';
import { useEffect, useRef, memo, useMemo } from 'react';
import { useCommands } from '@/app/state';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export const CommandsLogs = memo(function CommandsLogs({
    className,
    tone = 'sunken',
    glow,
}: Props) {
    const commands = useCommands();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commands]);

    const entries = useMemo(() => {
        return commands.map(command => {
            const endTimestamp = command.logs?.at(-1)?.timestamp ?? command.startedAt;
            const durationMs = Math.max(0, endTimestamp - command.startedAt);
            const duration = durationMs > 0 ? `${Math.round(durationMs / 1000)}s` : 'live';
            const body = command.logs?.map(log => log.data).join('').trim() ?? '';
            let status: 'running' | 'success' | 'error' | 'background' = 'running';
            if (command.exitCode !== undefined) {
                status = command.exitCode === 0 ? 'success' : 'error';
            } else if (command.background) {
                status = 'background';
            }

            const started = new Date(command.startedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            return {
                key: command.cmdId,
                status,
                duration,
                started,
                line: `${command.command} ${command.args.join(' ')}`.trim(),
                body,
            };
        });
    }, [commands]);

    return (
        <Panel className={className} tone={tone} glow={glow}>
            <PanelHeader tone="muted" className="gap-4">
                <div className="flex items-center gap-3 text-white/80">
                    <WavesIcon className="h-4 w-4" />
                    <span className="text-xs tracking-[0.3em]">Execution Timeline</span>
                </div>
                <span className="ml-auto text-[11px] uppercase tracking-[0.24em] text-white/40">
                    {commands.length} events
                </span>
            </PanelHeader>

            <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
                <ScrollArea className="h-full">
                    <div className="relative pl-6">
                        <span className="pointer-events-none absolute left-[7px] top-0 h-full w-[2px] rounded-full bg-gradient-to-b from-[rgba(75,139,255,0.45)] via-white/20 to-transparent" />
                        <div className="space-y-6">
                            {entries.length === 0 ? (
                                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                                    No commands executed yet.
                                </div>
                            ) : (
                                entries.map(entry => (
                                    <div key={entry.key} className="relative pl-6">
                                        <span
                                            className={cn(
                                                'absolute left-[7px] top-3 h-3 w-3 -translate-x-1/2 rounded-full border border-white/30 shadow-[0_12px_30px_-20px_rgba(75,139,255,0.6)]',
                                                statusClass(entry.status)
                                            )}
                                        />
                                        <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 text-sm text-white/80 backdrop-blur-xl">
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60">
                                                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                                                    {entry.started}
                                                </span>
                                                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                                                    {entry.duration}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'rounded-full border px-3 py-1',
                                                        badgeClass(entry.status)
                                                    )}
                                                >
                                                    {entry.status}
                                                </span>
                                            </div>
                                            <div className="mt-3 space-y-3">
                                                <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/70">
                                                    {entry.line}
                                                </p>
                                                {entry.body ? (
                                                    <pre className="max-h-48 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-white/70">
                                                        {entry.body}
                                                    </pre>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>
            </div>
        </Panel>
    );
});

function statusClass(status: 'running' | 'success' | 'error' | 'background') {
    switch (status) {
        case 'success':
            return 'border-[rgba(58,210,159,0.6)] bg-[rgba(58,210,159,0.35)]';
        case 'error':
            return 'border-[rgba(255,94,118,0.6)] bg-[rgba(255,94,118,0.35)]';
        case 'background':
            return 'border-[rgba(155,107,255,0.6)] bg-[rgba(155,107,255,0.35)]';
        default:
            return 'border-[rgba(75,139,255,0.6)] bg-[rgba(75,139,255,0.35)]';
    }
}

function badgeClass(status: 'running' | 'success' | 'error' | 'background') {
    switch (status) {
        case 'success':
            return 'border-[rgba(58,210,159,0.4)] bg-[rgba(58,210,159,0.2)] text-success';
        case 'error':
            return 'border-[rgba(255,94,118,0.4)] bg-[rgba(255,94,118,0.2)] text-danger';
        case 'background':
            return 'border-[rgba(155,107,255,0.4)] bg-[rgba(155,107,255,0.2)] text-white';
        default:
            return 'border-[rgba(75,139,255,0.4)] bg-[rgba(75,139,255,0.2)] text-white';
    }
}
