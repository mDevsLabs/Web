import { type HTMLAttributes } from 'react';
export interface GlassToolbarProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
}
export declare function GlassToolbar({ label, className, ...props }: GlassToolbarProps): import("react").JSX.Element;
