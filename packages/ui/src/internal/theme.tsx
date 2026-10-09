'use client';
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
export interface ThemeContextValue {
    theme: 'light' | 'dark' | 'system';
    glass: boolean;
    accent?: string;
    radius?: string;
    variables?: CSSProperties;
}
export const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', glass: true });
export function PortalScope({ children }: {
    children: ReactNode;
}) { const { theme, glass, accent, radius, variables } = useContext(ThemeContext); return <div className="md-root md-portal-scope" data-md-theme={theme} data-md-glass={glass ? 'on' : 'off'} style={{ ...variables, ...(accent ? { '--md-accent': accent } : {}), ...(radius ? { '--md-radius': radius } : {}) } as CSSProperties}>{children}</div>; }
