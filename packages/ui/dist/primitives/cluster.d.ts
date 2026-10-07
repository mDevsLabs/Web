import { type CSSProperties, type HTMLAttributes } from 'react';
export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
    gap?: number | string;
    justify?: CSSProperties['justifyContent'];
}
export declare function Cluster({ gap, justify, style, className, ...props }: ClusterProps): import("react").JSX.Element;
