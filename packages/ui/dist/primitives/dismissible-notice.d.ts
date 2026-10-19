import { type ReactNode, type HTMLAttributes } from 'react';
export interface DismissibleNoticeProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    children?: ReactNode;
    onDismiss: () => void;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export declare function DismissibleNotice({ heading, children, onDismiss, tone, className, ...props }: DismissibleNoticeProps): import("react").JSX.Element;
