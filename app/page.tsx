'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chat } from './chat';
import { FileExplorer } from './file-explorer';
import { Header } from './header';
import { Logs } from './logs';
import { Preview } from './preview';
import {
    MessageCircleIcon,
    FolderGit2Icon,
    MonitorSmartphoneIcon,
    WavesIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Horizontal, Vertical } from '@/components/layout/panels';

const MOBILE_SECTIONS = [
    {
        id: 'chat',
        label: 'Chat',
        icon: MessageCircleIcon,
    },
    {
        id: 'files',
        label: 'Files',
        icon: FolderGit2Icon,
    },
    {
        id: 'preview',
        label: 'Preview',
        icon: MonitorSmartphoneIcon,
    },
    {
        id: 'logs',
        label: 'Logs',
        icon: WavesIcon,
    },
] as const;

type SectionId = (typeof MOBILE_SECTIONS)[number]['id'];

export default function Page() {
    const [activeSection, setActiveSection] = useState<SectionId>('chat');
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 1023px)');
        const handler = (event: MediaQueryListEvent) => setIsCompact(event.matches);
        setIsCompact(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    const activeComponent = useMemo(() => {
        switch (activeSection) {
            case 'files':
                return <FileExplorer tone="surface" glow className="h-full" />;
            case 'preview':
                return <Preview tone="surface" glow className="h-full" />;
            case 'logs':
                return <Logs tone="sunken" glow className="h-full" />;
            case 'chat':
            default:
                return <Chat tone="glass" glow className="h-full" />;
        }
    }, [activeSection]);

    return (
        <div className="relative flex flex-1 flex-col overflow-hidden">
            <div className="safe-px safe-pb flex flex-1 flex-col gap-6 pt-[clamp(1.25rem,2vw,2.5rem)]">
                <Header />

                <div className="flex flex-1 flex-col">
                    {isCompact ? (
                        <div className="relative flex flex-1 flex-col pb-[6.5rem]">
                            <div className="relative flex-1 overflow-hidden rounded-[36px] border border-white/10 bg-surface-200/50 shadow-[0_50px_140px_-60px_rgba(8,16,32,0.95)] backdrop-blur-2xl">
                                <div className="absolute inset-0">
                                    {MOBILE_SECTIONS.map(section => (
                                        <div
                                            key={section.id}
                                            className={cn(
                                                'absolute inset-0 transform transition-all duration-500 ease-in-out',
                                                activeSection === section.id
                                                    ? 'pointer-events-auto opacity-100 translate-y-0'
                                                    : 'pointer-events-none opacity-0 translate-y-6'
                                            )}
                                        >
                                            {activeSection === section.id
                                                ? activeComponent
                                                : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <nav className="safe-px safe-pb pointer-events-auto fixed inset-x-0 bottom-0 z-50">
                                <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[28px] border border-white/12 bg-surface-glass/80 p-2 shadow-[0_40px_120px_-60px_rgba(8,16,32,0.9)] backdrop-blur-2xl">
                                    {MOBILE_SECTIONS.map(section => {
                                        const Icon = section.icon;
                                        const isActive = activeSection === section.id;
                                        return (
                                            <button
                                                key={section.id}
                                                type="button"
                                                onClick={() => setActiveSection(section.id)}
                                                className={cn(
                                                    'flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium uppercase tracking-[0.3em] transition',
                                                    isActive
                                                        ? 'border border-white/30 bg-white/20 text-white shadow-[0_25px_80px_-45px_rgba(75,139,255,0.8)]'
                                                        : 'border border-transparent text-white/60 hover:border-white/10 hover:bg-white/10'
                                                )}
                                            >
                                                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-white/60')} />
                                                <span className="hidden sm:inline">{section.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </nav>
                        </div>
                    ) : (
                        <div className="hidden flex-1 lg:block">
                            <Horizontal
                                defaultLayout={[34, 66]}
                                left={<div className="h-full min-h-0"><Chat tone="glass" glow className="h-full" /></div>}
                                right={
                                    <div className="flex h-full min-h-0 flex-col gap-6">
                                        <Vertical
                                            defaultLayout={[42, 32, 26]}
                                            top={<FileExplorer tone="surface" glow className="h-full" />}
                                            middle={<Preview tone="surface" glow className="h-full" />}
                                            bottom={<Logs tone="sunken" glow className="h-full" />}
                                        />
                                    </div>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
