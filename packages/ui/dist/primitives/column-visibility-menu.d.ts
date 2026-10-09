import { type HTMLAttributes } from 'react';
export interface ColumnVisibilityMenuProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    columns: readonly {
        key: string;
        label: string;
        required?: boolean;
    }[];
    visibleKeys: readonly string[];
    onVisibilityChange: (keys: string[]) => void;
}
export declare function ColumnVisibilityMenu({ label, columns, visibleKeys, onVisibilityChange, className, ...props }: ColumnVisibilityMenuProps): import("react").JSX.Element;
