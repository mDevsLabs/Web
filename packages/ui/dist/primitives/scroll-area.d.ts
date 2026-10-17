import { type ReactNode, type HTMLAttributes } from 'react';
export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    maxHeight?: number | string;
    children?: ReactNode;
}
export declare function ScrollArea({ label, maxHeight, children, className, style, ...props }: ScrollAreaProps): import("react").JSX.Element;
