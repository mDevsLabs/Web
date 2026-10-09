import { type CSSProperties, type ReactNode } from 'react';
export interface ThemeContextValue {
    theme: 'light' | 'dark' | 'system';
    glass: boolean;
    accent?: string;
    radius?: string;
    variables?: CSSProperties;
}
export declare const ThemeContext: import("react").Context<ThemeContextValue>;
export declare function PortalScope({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
