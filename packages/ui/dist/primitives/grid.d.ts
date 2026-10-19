import { type HTMLAttributes } from 'react';
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
    minColumnWidth?: number | string;
    gap?: number | string;
}
export declare function Grid({ minColumnWidth, gap, style, className, ...props }: GridProps): import("react").JSX.Element;
