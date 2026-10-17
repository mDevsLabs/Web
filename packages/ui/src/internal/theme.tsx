'use client';
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
export interface ThemeContextValue {
    theme: 'light' | 'dark' | 'system';
    glass: boolean;
    variant: 'liquid-glass' | 'chatgpt';
    accent?: string;
    radius?: string;
    variables?: CSSProperties;
}
export const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', glass: true, variant: 'liquid-glass' });
export function PortalScope({ children }: {
    children: ReactNode;
}) { const { theme, glass, variant, accent, radius, variables } = useContext(ThemeContext); return <div className="md-root md-portal-scope" data-md-theme={theme} data-md-glass={glass ? 'on' : 'off'} data-md-variant={variant} style={{ ...variables, ...(accent ? { '--md-accent': accent } : {}), ...(radius ? { '--md-radius': radius } : {}) } as CSSProperties}>{children}</div>; }
