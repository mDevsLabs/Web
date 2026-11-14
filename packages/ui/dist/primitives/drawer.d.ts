import { type ReactNode } from 'react';
export interface DrawerProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'right' | 'bottom';
    closeLabel?: string;
    container?: HTMLElement | null;
}
export declare function Drawer({ title, description, trigger, children, side, closeLabel, container, ...props }: DrawerProps): import("react").JSX.Element;
