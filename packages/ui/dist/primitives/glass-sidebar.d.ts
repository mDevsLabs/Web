import { type HTMLAttributes } from 'react';
export interface GlassSidebarProps extends HTMLAttributes<HTMLElement> {
    label: string;
}
export declare function GlassSidebar({ label, className, ...props }: GlassSidebarProps): import("react").JSX.Element;
