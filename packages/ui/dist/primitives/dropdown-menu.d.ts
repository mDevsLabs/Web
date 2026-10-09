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
}
export declare function DropdownMenu({ trigger, items, label }: DropdownMenuProps): import("react").JSX.Element;
