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
}
export declare function Drawer({ title, description, trigger, children, side, closeLabel, ...props }: DrawerProps): import("react").JSX.Element;
