import { type HTMLAttributes } from 'react';
export interface ExpandableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
        details: string;
    })[];
    expandedIds: readonly string[];
    onExpandedChange: (ids: string[]) => void;
}
export declare function ExpandableTable({ caption, columns, rows, expandedIds, onExpandedChange, className, ...props }: ExpandableTableProps): import("react").JSX.Element;
