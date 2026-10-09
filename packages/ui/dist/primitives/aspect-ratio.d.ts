import { type HTMLAttributes } from 'react';
export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
    ratio?: number;
}
export declare function AspectRatio({ ratio, style, className, ...props }: AspectRatioProps): import("react").JSX.Element;
