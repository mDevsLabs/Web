import { type ReactNode, type HTMLAttributes } from 'react';
export interface StatProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: ReactNode;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export declare function Stat({ label, value, change, tone, className, ...props }: StatProps): import("react").JSX.Element;
