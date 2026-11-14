import { type ReactNode } from 'react';
export interface DropdownMenuItem {
    id: string;
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    danger?: boolean;
    separatorBefore?: boolean;
}
export interface DropdownMenuProps {
    trigger: ReactNode;
    items: readonly DropdownMenuItem[];
    label: string;
    container?: HTMLElement | null;
}
export declare function DropdownMenu({ trigger, items, label, container }: DropdownMenuProps): import("react").JSX.Element;
