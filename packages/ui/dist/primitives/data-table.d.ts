import { type ReactNode } from 'react';
export interface DataTableColumn<T> {
    key: keyof T & string;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
    sortable?: boolean;
}
export interface DataTableProps<T> {
    columns: readonly DataTableColumn<T>[];
    rows: readonly T[];
    getRowKey: (row: T) => string;
    caption: string;
    emptyMessage?: string;
    className?: string;
}
export declare function DataTable<T>({ columns, rows, getRowKey, caption, emptyMessage, className }: DataTableProps<T>): import("react").JSX.Element;
