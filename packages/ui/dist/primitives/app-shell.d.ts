import { type ReactNode, type HTMLAttributes } from 'react';
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
    header?: ReactNode;
    sidebar?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    mainId?: string;
    mainLabel?: string;
}
export declare function AppShell({ header, sidebar, footer, children, mainId, mainLabel, className, ...props }: AppShellProps): import("react").JSX.Element;
