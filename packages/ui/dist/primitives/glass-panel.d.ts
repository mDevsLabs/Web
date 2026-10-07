import { type HTMLAttributes } from 'react';
export interface GlassPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title: string;
    defaultOpen?: boolean;
}
export declare function GlassPanel({ title, defaultOpen, children, className, ...props }: GlassPanelProps): import("react").JSX.Element;
