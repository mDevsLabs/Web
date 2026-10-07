import { type HTMLAttributes } from 'react';
export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
    theme?: 'light' | 'dark' | 'system';
    accent?: string;
    radius?: string;
    glass?: boolean;
}
export declare function ThemeProvider({ theme, accent, radius, glass, className, style, ...props }: ThemeProviderProps): import("react").JSX.Element;
