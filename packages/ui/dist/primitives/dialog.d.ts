import { type ReactNode } from 'react';
export interface DialogProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeLabel?: string;
    container?: HTMLElement | null;
}
export declare function Dialog({ title, description, trigger, children, footer, closeLabel, container, ...props }: DialogProps): import("react").JSX.Element;
