import { type HTMLAttributes } from 'react';
export interface EditableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    value: readonly (Record<string, string> & {
        id: string;
    })[];
    onValueChange: (rows: (Record<string, string> & {
        id: string;
    })[]) => void;
    disabled?: boolean;
}
export declare function EditableTable({ caption, columns, value, onValueChange, disabled, className, ...props }: EditableTableProps): import("react").JSX.Element;
