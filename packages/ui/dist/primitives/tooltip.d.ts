import { type ReactNode } from 'react';
export interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
}
export declare function Tooltip({ content, children, delayDuration, side }: TooltipProps): import("react").JSX.Element;
