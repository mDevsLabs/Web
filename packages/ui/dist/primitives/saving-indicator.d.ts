import { type HTMLAttributes } from 'react';
export interface SavingIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
    state: 'idle' | 'saving' | 'saved' | 'error';
    labels?: Partial<Record<'idle' | 'saving' | 'saved' | 'error', string>>;
}
export declare function SavingIndicator({ state, labels, className, ...props }: SavingIndicatorProps): import("react").JSX.Element;
