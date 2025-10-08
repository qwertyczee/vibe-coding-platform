'use client';

import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { HORIZONTAL_COOKIE, VERTICAL_COOKIE } from './sizing';
import { useCallback } from 'react';
import { PanelGroupWrapper } from './panel-group-wrapper';

interface HProps {
    left: React.ReactNode;
    right: React.ReactNode;
    defaultLayout: number[];
}

export function Horizontal({ defaultLayout, left, right }: HProps) {
    const onLayout = useCallback((sizes: number[]) => {
        document.cookie = `${HORIZONTAL_COOKIE}=${JSON.stringify(sizes)}`;
    }, []);
    return (
        <PanelGroupWrapper direction="horizontal" onLayout={onLayout}>
            <Panel defaultSize={defaultLayout[0]}>{left}</Panel>
            <PanelResizeHandle className="relative flex w-4 items-center justify-center px-1">
                <span className="pointer-events-none h-12 w-[2px] rounded-full bg-white/10 transition-colors duration-200 data-[resize-handle-active=true]:bg-[rgba(75,139,255,0.65)]" />
            </PanelResizeHandle>
            <Panel defaultSize={defaultLayout[1]}>{right}</Panel>
        </PanelGroupWrapper>
    );
}

interface VProps {
    defaultLayout: number[];
    top: React.ReactNode;
    middle?: React.ReactNode;
    bottom: React.ReactNode;
}

export function Vertical({ defaultLayout, top, middle, bottom }: VProps) {
    const onLayout = useCallback((sizes: number[]) => {
        document.cookie = `${VERTICAL_COOKIE}=${JSON.stringify(sizes)}`;
    }, []);
    if (middle) {
        return (
            <PanelGroupWrapper direction="vertical" onLayout={onLayout}>
                <Panel defaultSize={defaultLayout[0]}>{top}</Panel>
            <PanelResizeHandle className="relative flex h-3 w-full items-center justify-center py-1">
                    <span className="pointer-events-none w-12 rounded-full bg-white/10 py-[1px] transition-colors duration-200 data-[resize-handle-active=true]:bg-[rgba(75,139,255,0.65)]" />
                </PanelResizeHandle>
                <Panel defaultSize={defaultLayout[1]}>{middle}</Panel>
                <PanelResizeHandle className="relative flex h-3 w-full items-center justify-center py-1">
                    <span className="pointer-events-none w-12 rounded-full bg-white/10 py-[1px] transition-colors duration-200 data-[resize-handle-active=true]:bg-[rgba(75,139,255,0.65)]" />
                </PanelResizeHandle>
                <Panel defaultSize={defaultLayout[2]}>{bottom}</Panel>
            </PanelGroupWrapper>
        );
    } else {
        return (
            <PanelGroupWrapper direction="vertical" onLayout={onLayout}>
                <Panel defaultSize={defaultLayout[0]}>{top}</Panel>
                <PanelResizeHandle className="relative flex h-3 w-full items-center justify-center py-1">
                    <span className="pointer-events-none w-12 rounded-full bg-white/10 py-[1px] transition-colors duration-200 data-[resize-handle-active=true]:bg-[rgba(75,139,255,0.65)]" />
                </PanelResizeHandle>
                <Panel defaultSize={defaultLayout[1]}>{bottom}</Panel>
            </PanelGroupWrapper>
        );
    }
}
