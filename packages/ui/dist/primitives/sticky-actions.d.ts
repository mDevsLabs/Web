import { type ReactNode, type HTMLAttributes } from 'react';
export interface StickyActionsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    position?: 'top' | 'bottom';
    children?: ReactNode;
}
export declare function StickyActions({ label, position, children, className, ...props }: StickyActionsProps): import("react").JSX.Element;
