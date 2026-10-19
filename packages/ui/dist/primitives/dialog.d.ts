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
}
export declare function Dialog({ title, description, trigger, children, footer, closeLabel, ...props }: DialogProps): import("react").JSX.Element;
