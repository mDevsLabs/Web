import { type HTMLAttributes } from 'react';
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}
export declare function Badge({ tone, className, ...props }: BadgeProps): import("react").JSX.Element;
