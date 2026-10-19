import { type ReactNode } from 'react';
export interface CommandItem {
    id: string;
    label: string;
    keywords?: string;
    onSelect: () => void;
}
export interface CommandPaletteProps {
    items: readonly CommandItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    title?: string;
}
export declare function CommandPalette({ items, open, onOpenChange, trigger, title }: CommandPaletteProps): import("react").JSX.Element;
