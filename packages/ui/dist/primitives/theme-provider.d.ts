import { type HTMLAttributes } from 'react';
export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
    theme?: 'light' | 'dark' | 'system';
    variant?: 'liquid-glass' | 'chatgpt';
    accent?: string;
    radius?: string;
    glass?: boolean;
}
export declare function ThemeProvider({ theme, accent, radius, glass, className, style, ...props }: ThemeProviderProps): import("react").JSX.Element;
