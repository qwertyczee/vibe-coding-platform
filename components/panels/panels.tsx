import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

export type PanelTone = 'glass' | 'surface' | 'sunken';
export type PanelHeaderTone = 'default' | 'muted' | 'accent';

interface PanelProps {
    className?: string;
    children: ReactNode;
    tone?: PanelTone;
    glow?: boolean;
}

const toneClasses: Record<PanelTone, string> = {
    glass: 'bg-surface-glass/80 backdrop-blur-2xl border-white/10',
    surface: 'bg-surface-100/95 backdrop-blur-xl border-white/8',
    sunken: 'bg-surface-200/90 backdrop-blur-xl border-white/6',
};

const glowClasses =
    'shadow-[0_0_60px_-20px_rgba(75,139,255,0.65)] ring-1 ring-[rgba(75,139,255,0.35)]';

export const Panel = memo(function Panel({
    className,
    children,
    tone = 'glass',
    glow,
}: PanelProps) {
    return (
        <div
            className={cn(
                'group/panel relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border transition-colors duration-300',
                'before:pointer-events-none before:absolute before:inset-0 before:rounded-[24px] before:border before:border-white/6 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
                toneClasses[tone],
                glow && glowClasses,
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(75,139,255,0.22),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />
            {children}
        </div>
    );
});

interface PanelHeaderProps {
    className?: string;
    children: ReactNode;
    tone?: PanelHeaderTone;
}

const headerToneClasses: Record<PanelHeaderTone, string> = {
    default:
        'bg-gradient-to-r from-white/6 via-white/4 to-white/6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
    muted:
        'bg-gradient-to-r from-black/20 via-white/5 to-black/20 text-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    accent:
        'bg-[linear-gradient(130deg,rgba(75,139,255,0.45),rgba(155,107,255,0.35))] text-white shadow-[0_10px_40px_rgba(75,139,255,0.3)]',
};

export const PanelHeader = memo(function PanelHeader({
    className,
    children,
    tone = 'default',
}: PanelHeaderProps) {
    return (
        <div
            className={cn(
                'relative z-[1] flex items-center gap-3 px-5 py-3 text-sm uppercase tracking-[0.15em]',
                'before:absolute before:inset-0 before:rounded-[20px] before:border before:border-white/8 before:opacity-40 before:backdrop-blur-xl',
                headerToneClasses[tone],
                className
            )}
        >
            <div className="relative flex w-full items-center gap-3">{children}</div>
        </div>
    );
});
