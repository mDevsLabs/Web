import { type HTMLAttributes } from 'react';
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    src?: string;
    name: string;
    size?: number;
}
export declare function Avatar({ src, name, size, style, className, ...props }: AvatarProps): import("react").JSX.Element;
