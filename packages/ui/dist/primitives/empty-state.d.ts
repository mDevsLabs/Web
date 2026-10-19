import { type ReactNode, type HTMLAttributes } from 'react';
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    description?: string;
    action?: ReactNode;
}
export declare function EmptyState({ heading, description, action, className, ...props }: EmptyStateProps): import("react").JSX.Element;
