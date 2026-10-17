import { type HTMLAttributes } from 'react';
export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}
export declare const GlassSurface: import("react").ForwardRefExoticComponent<GlassSurfaceProps & import("react").RefAttributes<HTMLDivElement>>;
