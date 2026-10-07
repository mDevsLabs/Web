import { type ReactNode, type HTMLAttributes } from 'react';
export interface MasterDetailProps extends HTMLAttributes<HTMLDivElement> {
    items: readonly {
        id: string;
        label: string;
        description?: string;
    }[];
    selectedId?: string;
    onSelectionChange: (id: string) => void;
    children?: ReactNode;
    label: string;
    emptyMessage?: string;
}
export declare function MasterDetail({ items, selectedId, onSelectionChange, children, label, emptyMessage, className, ...props }: MasterDetailProps): import("react").JSX.Element;
