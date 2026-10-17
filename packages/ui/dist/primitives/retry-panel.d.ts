import { type HTMLAttributes } from 'react';
export interface RetryPanelProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onRetry: () => void;
    pending?: boolean;
    retryLabel?: string;
}
export declare function RetryPanel({ message, onRetry, pending, retryLabel, className, ...props }: RetryPanelProps): import("react").JSX.Element;
