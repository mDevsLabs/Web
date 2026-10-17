import { type HTMLAttributes } from 'react';
export interface SparklineProps extends HTMLAttributes<HTMLElement> {
    label: string;
    values: readonly number[];
    width?: number;
    height?: number;
}
export declare function Sparkline({ label, values, width, height, className, ...props }: SparklineProps): import("react").JSX.Element;
