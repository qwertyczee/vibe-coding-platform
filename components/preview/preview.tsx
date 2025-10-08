'use client';

import { BarLoader } from 'react-spinners';
import {
    CompassIcon,
    MonitorSmartphoneIcon,
    RefreshCwIcon,
    SmartphoneIcon,
    TabletSmartphoneIcon,
} from 'lucide-react';
import { Panel, PanelHeader, type PanelTone } from '@/components/panels/panels';
import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
    className?: string;
    disabled?: boolean;
    url?: string;
    tone?: PanelTone;
    glow?: boolean;
}

type DevicePreset = 'desktop' | 'tablet' | 'mobile';

const DEVICE_STYLES: Record<DevicePreset, string> = {
    desktop: 'mx-auto h-full w-full',
    tablet: 'mx-auto h-full w-[900px] max-w-full',
    mobile: 'mx-auto h-full w-[420px] max-w-full',
};

const DEVICE_ICON: Record<DevicePreset, JSX.Element> = {
    desktop: <MonitorSmartphoneIcon className="h-4 w-4" />,
    tablet: <TabletSmartphoneIcon className="h-4 w-4" />,
    mobile: <SmartphoneIcon className="h-4 w-4" />,
};

export function Preview({ className, disabled, url, tone = 'surface', glow }: Props) {
    const [currentUrl, setCurrentUrl] = useState(url);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState(url || '');
    const [isLoading, setIsLoading] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [device, setDevice] = useState<DevicePreset>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadStartTime = useRef<number | null>(null);

    useEffect(() => {
        setCurrentUrl(url);
        setInputValue(url || '');
    }, [url]);

    const refreshIframe = () => {
        if (iframeRef.current && currentUrl) {
            setIsLoading(true);
            setError(null);
            loadStartTime.current = performance.now();
            iframeRef.current.src = '';
            requestAnimationFrame(() => {
                if (iframeRef.current) {
                    iframeRef.current.src = currentUrl;
                }
            });
        }
    };

    const loadNewUrl = () => {
        if (iframeRef.current && inputValue) {
            if (inputValue !== currentUrl) {
                setIsLoading(true);
                setError(null);
                loadStartTime.current = performance.now();
                iframeRef.current.src = inputValue;
                setCurrentUrl(inputValue);
            } else {
                refreshIframe();
            }
        }
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
        setError(null);
        if (loadStartTime.current) {
            setLatency(Math.max(0, Math.round(performance.now() - loadStartTime.current)));
        }
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setError('Failed to load the page');
    };

    const deviceButtons = useMemo(
        () =>
            (['desktop', 'tablet', 'mobile'] as DevicePreset[]).map(preset => (
                <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(
                        'h-9 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 transition hover:border-white/30 hover:bg-white/10',
                        device === preset &&
                            'border-white/40 bg-white/20 text-white shadow-[0_20px_60px_-45px_rgba(75,139,255,0.6)]'
                    )}
                    onClick={() => setDevice(preset)}
                >
                    <span className="mr-2">{DEVICE_ICON[preset]}</span>
                    <span className="capitalize">{preset}</span>
                </Button>
            )),
        [device]
    );

    return (
        <Panel className={className} tone={tone} glow={glow}>
            <PanelHeader tone="muted" className="flex-wrap gap-4">
                <div className="flex items-center gap-3 text-white/80">
                    <CompassIcon className="h-4 w-4" />
                    <span className="text-xs tracking-[0.3em]">Preview Browser</span>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/60">
                    {latency !== null ? (
                        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
                            <span className="h-2 w-2 rounded-full bg-[rgba(75,139,255,0.8)]" />
                            {latency} ms
                        </span>
                    ) : (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                            Waiting…
                        </span>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-full border border-white/10 bg-white/10 text-xs text-white/70 hover:bg-white/20"
                        onClick={refreshIframe}
                        disabled={disabled || !currentUrl}
                    >
                        <RefreshCwIcon
                            className={cn('mr-2 h-4 w-4 transition', {
                                'animate-spin': isLoading,
                            })}
                        />
                        Refresh
                    </Button>
                </div>
            </PanelHeader>

            <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
                <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur-xl md:flex-row md:items-center">
                    <div className="flex flex-1 items-center gap-3">
                        <CompassIcon className="h-4 w-4 text-white/60" />
                        <input
                            type="text"
                            className="h-9 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                            onChange={event => setInputValue(event.target.value)}
                            onClick={event => event.currentTarget.select()}
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    loadNewUrl();
                                }
                            }}
                            value={inputValue}
                            placeholder="https://"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="h-9 rounded-full bg-[linear-gradient(135deg,rgba(75,139,255,0.95),rgba(155,107,255,0.85))] px-4 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:opacity-90"
                            onClick={loadNewUrl}
                            disabled={disabled || !inputValue}
                        >
                            Go
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3">{deviceButtons}</div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-black/60 p-6">
                    {disabled ? (
                        <div className="text-sm text-white/60">
                            The sandbox is stopped. Run a command to see the preview.
                        </div>
                    ) : currentUrl ? (
                        <div
                            className={cn(
                                'relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_40px_120px_-60px_rgba(8,16,32,0.9)]',
                                DEVICE_STYLES[device]
                            )}
                        >
                            <iframe
                                ref={iframeRef}
                                src={currentUrl}
                                className="h-full w-full"
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                                title="Browser content"
                            />
                            {isLoading && !error ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur">
                                    <BarLoader color="#4b8bff" />
                                    <span className="text-xs tracking-[0.3em] text-white/70">
                                        Loading…
                                    </span>
                                </div>
                            ) : null}
                            {error ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 text-center text-sm text-white/80">
                                    <p>{error}</p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="rounded-full bg-white/10 px-4 text-xs uppercase tracking-[0.3em] text-white hover:bg-white/20"
                                        onClick={refreshIframe}
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-sm text-white/60">
                            Provide a sandbox preview URL to get started.
                        </div>
                    )}
                </div>
            </div>
        </Panel>
    );
}
