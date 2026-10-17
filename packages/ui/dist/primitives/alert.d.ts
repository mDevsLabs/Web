import { type HTMLAttributes } from 'react';
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    tone?: 'info' | 'success' | 'warning' | 'danger';
    heading?: string;
    live?: boolean;
}
export declare function Alert({ tone, heading, live, className, children, ...props }: AlertProps): import("react").JSX.Element;
