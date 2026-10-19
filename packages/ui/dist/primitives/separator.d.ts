import { type HTMLAttributes } from 'react';
export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
}
export declare function Separator({ orientation, decorative, className, ...props }: SeparatorProps): import("react").JSX.Element;
