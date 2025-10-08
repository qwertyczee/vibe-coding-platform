'use client';

import { VercelDashed } from '@/components/icons/vercel-dashed';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MoonStarIcon, PanelsTopLeftIcon, SparklesIcon } from 'lucide-react';
import { useSandboxId, useSandboxStatus, useSandboxUrl } from './state';
import { memo, useMemo } from 'react';

interface Props {
    className?: string;
}

export const Header = memo(function Header({ className }: Props) {
    const status = useSandboxStatus();
    const sandboxId = useSandboxId();
    const { url } = useSandboxUrl();

    const statusLabel = status === 'running' ? 'Live Sandbox' : 'Sandbox Idle';
    const statusClass =
        status === 'running'
            ? 'border-[rgba(58,210,159,0.35)] bg-[rgba(58,210,159,0.12)] text-success'
            : 'border-[rgba(255,94,118,0.35)] bg-[rgba(255,94,118,0.12)] text-danger';

    const previewHost = useMemo(() => {
        if (!url) {
            return null;
        }
        try {
            const parsed = new URL(url);
            return parsed.host;
        } catch (error) {
            return url;
        }
    }, [url]);

    return (
        <header
            className={cn(
                'relative flex w-full flex-col gap-4 rounded-[32px] border border-white/10 bg-surface-glass/70 px-5 py-4 backdrop-blur-2xl shadow-[0_40px_120px_-60px_rgba(9,16,32,0.9)]',
                'before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:border before:border-white/10 before:opacity-60 before:mix-blend-screen',
                'after:pointer-events-none after:absolute after:inset-0 after:rounded-[32px] after:bg-[linear-gradient(135deg,rgba(75,139,255,0.2),transparent_65%)] after:opacity-70 after:transition-opacity after:duration-700',
                className
            )}
        >
            <div className="relative flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(75,139,255,0.5),rgba(12,17,29,0.6))] shadow-[0_25px_45px_-30px_rgba(75,139,255,0.7)]">
                        <VercelDashed className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.48em] text-foreground/60">
                            Vibe Studio
                        </p>
                        <h1 className="truncate text-lg font-semibold text-white md:text-2xl">
                            OSS Vibe Coding Platform
                        </h1>
                    </div>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <span
                        className={cn(
                            'rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
                            statusClass
                        )}
                    >
                        {statusLabel}
                    </span>
                    {sandboxId ? (
                        <span className="rounded-full border border-white/10 px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-foreground/70">
                            Sandbox · {sandboxId.slice(0, 8)}
                        </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-white/5 bg-white/5 text-white hover:bg-white/10"
                        aria-label="Toggle theme"
                    >
                        <MoonStarIcon className="h-5 w-5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-white/5 bg-white/5 text-white hover:bg-white/10"
                        aria-label="Workspace actions"
                    >
                        <PanelsTopLeftIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="relative flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-xs text-foreground/70">
                    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <SparklesIcon className="h-3.5 w-3.5 text-accent-secondary" />
                        Guided coding session
                    </span>
                    {previewHost ? (
                        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 md:flex">
                            <span className="h-2 w-2 rounded-full bg-[rgba(75,139,255,0.75)]" />
                            Preview at {previewHost}
                        </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    <span
                        className={cn(
                            'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
                            statusClass
                        )}
                    >
                        {statusLabel}
                    </span>
                    {sandboxId ? (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-foreground/70">
                            {sandboxId.slice(0, 6)}
                        </span>
                    ) : null}
                </div>
            </div>
        </header>
    );
});
