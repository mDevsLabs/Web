import { type HTMLAttributes } from 'react';
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
    names: readonly string[];
    max?: number;
}
export declare function AvatarGroup({ names, max, className, ...props }: AvatarGroupProps): import("react").JSX.Element;
