import { type HTMLAttributes } from 'react';
export interface SelectableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
    })[];
    selectedIds: readonly string[];
    onSelectionChange: (ids: string[]) => void;
}
export declare function SelectableTable({ caption, columns, rows, selectedIds, onSelectionChange, className, ...props }: SelectableTableProps): import("react").JSX.Element;
