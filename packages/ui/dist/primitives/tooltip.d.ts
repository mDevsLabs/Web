import { type ReactNode } from 'react';
export interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    container?: HTMLElement | null;
}
export declare function Tooltip({ content, children, delayDuration, side, container }: TooltipProps): import("react").JSX.Element;
