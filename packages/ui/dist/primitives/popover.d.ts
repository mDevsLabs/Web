import { type ReactNode } from 'react';
export interface PopoverProps {
    trigger: ReactNode;
    children?: ReactNode;
    label: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'top' | 'right' | 'bottom' | 'left';
    container?: HTMLElement | null;
}
export declare function Popover({ trigger, children, label, side, container, ...props }: PopoverProps): import("react").JSX.Element;
