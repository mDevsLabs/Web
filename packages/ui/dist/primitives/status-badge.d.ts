import { type HTMLAttributes } from 'react';
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: 'online' | 'offline' | 'busy' | 'away';
    labels?: Partial<Record<'online' | 'offline' | 'busy' | 'away', string>>;
}
export declare function StatusBadge({ status, labels, className, ...props }: StatusBadgeProps): import("react").JSX.Element;
