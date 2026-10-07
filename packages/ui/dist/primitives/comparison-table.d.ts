import { type HTMLAttributes } from 'react';
export interface ComparisonTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        id: string;
        label: string;
    }[];
    features: readonly {
        id: string;
        label: string;
        values: Readonly<Record<string, string | number | boolean>>;
    }[];
}
export declare function ComparisonTable({ caption, columns, features, className, ...props }: ComparisonTableProps): import("react").JSX.Element;
