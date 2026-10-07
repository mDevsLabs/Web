import { type HTMLAttributes } from 'react';
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
    width?: number | string;
    height?: number | string;
}
export declare function Skeleton({ width, height, style, className, ...props }: SkeletonProps): import("react").JSX.Element;
