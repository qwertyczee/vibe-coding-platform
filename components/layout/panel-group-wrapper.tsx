'use client';

import { PanelGroup } from 'react-resizable-panels';
import { memo } from 'react';
import type { PanelGroupProps } from 'react-resizable-panels';

interface Props extends PanelGroupProps {
    children: React.ReactNode;
}

export const PanelGroupWrapper = memo(function PanelGroupWrapper({ children, ...props }: Props) {
    return (
        <PanelGroup {...props}>
            {children}
        </PanelGroup>
    );
});