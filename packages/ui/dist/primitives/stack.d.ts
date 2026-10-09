import { type CSSProperties, type HTMLAttributes } from 'react';
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
    gap?: number | string;
    align?: CSSProperties['alignItems'];
}
export declare function Stack({ gap, align, style, className, ...props }: StackProps): import("react").JSX.Element;
